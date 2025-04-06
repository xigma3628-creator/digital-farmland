from qgis.core import *
from qgis.gui import *
from datetime import datetime, timedelta
from qgis.utils import qgsfunction
from qgis.PyQt.QtCore import Qt, QDateTime

feature_cache = {}

@qgsfunction(
    args='auto',
    group='Custom',
    referenced_columns=['group', 'vertex_index'],
    usesGeometry=True,
    handlesnull=False
)
def generate_grouped_timestamps(speed, start_time_str, layer_name, feature, parent):
    """
    根据分组和顶点索引生成带时间戳的路径数据
    <h2>参数:</h2>
    <ul>
      <li>speed: 移动速度（单位：米/秒，float类型）</li>
      <li>start_time_str: 起始时间（ISO 8601格式字符串，如'2023-08-25T08:00:00Z'）</li>
      <li>layer_name: 包含路径顶点的图层名称（需与工程中的图层名完全一致）</li>
    </ul>
    <h2>功能说明:</h2>
    基于分组（group字段）和顶点顺序（vertex_index字段），计算每个顶点的精确时间戳。
    时间间隔根据相邻顶点的地理距离和给定速度自动计算。

    <h2>示例用法:</h2>
    <ul>
      <li>generate_grouped_timestamps(1.2, '2023-08-25T08:00:00Z', 'pedestrian_path')</li>
      <li>generate_grouped_timestamps(5.0, '2023-08-25T00:00:00Z', 'vehicle_trajectory')</li>
    </ul>

    <h2>返回格式:</h2>
    ISO 8601时间字符串（UTC时区），例如：'2023-08-25T08:05:30Z'

    <h2>错误处理:</h2>
    错误信息会以'Error:'开头，包含具体错误描述（如图层缺失、顶点索引不连续等）
    """
    try:
        current_group = feature['group']
        current_vindex = feature['vertex_index']

        layers = QgsProject.instance().mapLayersByName(layer_name)
        if not layers:
            return f"Error: 图层 '{layer_name}' 不存在"
        layer = layers[0]

        if layer_name not in feature_cache:
            feature_cache[layer_name] = {}

        if current_group not in feature_cache[layer_name]:
            request = QgsFeatureRequest().setFilterExpression(f'"group" = \'{current_group}\'')
            features = {f['vertex_index']: f for f in layer.getFeatures(request)}
            feature_cache[layer_name][current_group] = dict(sorted(features.items()))

        group_features = feature_cache[layer_name][current_group]

        indexes = sorted(group_features.keys())
        if current_vindex not in indexes:
            return f"错误: 分组 {current_group} 中缺失顶点索引 {current_vindex}"
        if indexes != list(range(indexes[0], indexes[-1] + 1)):
            return f"错误: 分组 {current_group} 的vertex_index不连续"

        start_time = datetime.strptime(start_time_str, "%Y-%m-%dT%H:%M:%SZ")
        if current_vindex == 0:
            return QDateTime(start_time).toString(Qt.ISODate)

        d = QgsDistanceArea()
        d.setEllipsoid(QgsProject.instance().crs().ellipsoidAcronym())

        total_seconds = 0.0
        for i in range(0, current_vindex):
            if i not in group_features or (i+1) not in group_features:
                return f"错误: 分组 {current_group} 中缺失顶点索引 {i} 或 {i+1}"

            prev_feat = group_features[i]
            current_feat = group_features[i+1]

            distance = d.measureLine(
                prev_feat.geometry().asPoint(),
                current_feat.geometry().asPoint()
            )
            total_seconds += distance / speed

        timestamp = start_time + timedelta(seconds=total_seconds)
        return QDateTime(timestamp).toString(Qt.ISODate)

    except Exception as e:
        return f"系统错误: {str(e)}"
