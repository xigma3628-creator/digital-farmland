import * as Cesium from 'cesium'

class CustomVelocityOrientationProperty implements Cesium.Property {
  private _velocityVectorProperty: Cesium.VelocityVectorProperty;
  private _ellipsoid: Cesium.Ellipsoid;
  private _modelOffsetAngle: number;
  private _definitionChanged: Cesium.Event;

  constructor(position: Cesium.PositionProperty, ellipsoid: Cesium.Ellipsoid = Cesium.Ellipsoid.WGS84, modelOffsetAngle: number = 0) {
    this._velocityVectorProperty = new Cesium.VelocityVectorProperty(position, true);
    this._ellipsoid = Cesium.defaultValue(ellipsoid, Cesium.Ellipsoid.WGS84);
    this._modelOffsetAngle = modelOffsetAngle;
    this._definitionChanged = new Cesium.Event();

    const that = this;
    this._velocityVectorProperty.definitionChanged.addEventListener(() => {
      that._definitionChanged.raiseEvent(that);
    });
  }

  /**
   * Gets a value indicating if this property is constant.
   * @readonly
   */
  get isConstant(): boolean {
    return Cesium.Property.isConstant(this._velocityVectorProperty);
  }

  /**
   * Gets the event that is raised whenever the definition of this property changes.
   * @readonly
   */
  get definitionChanged(): Cesium.Event {
    return this._definitionChanged;
  }

  /**
   * Gets or sets the position property used to compute orientation.
   */
  get position(): Cesium.Property {
    return this._velocityVectorProperty.position;
  }

  set position(value: Cesium.Property) {
    this._velocityVectorProperty.position = value;
  }

  /**
   * Gets or sets the ellipsoid used to determine which way is up.
   */
  get ellipsoid(): Cesium.Ellipsoid {
    return this._ellipsoid;
  }

  set ellipsoid(value: Cesium.Ellipsoid) {
    const oldValue = this._ellipsoid;
    if (oldValue !== value) {
      this._ellipsoid = value;
      this._definitionChanged.raiseEvent(this);
    }
  }

  /**
   * Gets or sets the fixed angle used to correct the model's initial orientation.
   */
  get modelOffsetAngle(): number {
    return this._modelOffsetAngle;
  }

  set modelOffsetAngle(value: number) {
    this._modelOffsetAngle = value;
    this._definitionChanged.raiseEvent(this);
  }

  private static positionScratch = new Cesium.Cartesian3();
  private static velocityScratch = new Cesium.Cartesian3();
  private static rotationScratch = new Cesium.Matrix3();
  private static timeScratch = new Cesium.JulianDate();
  private static offsetQuaternionScratch = new Cesium.Quaternion();

  /**
   * Gets the value of the property at the provided time.
   * This method computes the orientation, applying a fixed offset rotation to solve the initial orientation issue.
   *
   * @param {JulianDate} [time=JulianDate.now()] The time for which to retrieve the value. If omitted, the current system time is used.
   * @param {Quaternion} [result] The object to store the value into, if omitted, a new instance is created and returned.
   * @returns {Quaternion} The modified result parameter or a new instance if the result parameter was not supplied.
   */
  getValue(time: Cesium.JulianDate = Cesium.JulianDate.now(), result: Cesium.Quaternion = new Cesium.Quaternion()): Cesium.Quaternion | undefined {
    // 获取当前时间的速度向量
    const velocity = this._velocityVectorProperty._getValue(time, CustomVelocityOrientationProperty.velocityScratch, CustomVelocityOrientationProperty.positionScratch);

    if (!Cesium.defined(velocity)) {
      return undefined;
    }

    // 通过位置和速度计算旋转矩阵
    Cesium.Transforms.rotationMatrixFromPositionVelocity(CustomVelocityOrientationProperty.positionScratch, velocity, this._ellipsoid, CustomVelocityOrientationProperty.rotationScratch);

    // 将旋转矩阵转换为四元数
    const rotation = Cesium.Quaternion.fromRotationMatrix(CustomVelocityOrientationProperty.rotationScratch, result);

    // 添加模型的初始偏移修正，绕Z轴偏移_modelOffsetAngle
    const offsetQuaternion = Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_Z, this._modelOffsetAngle, CustomVelocityOrientationProperty.offsetQuaternionScratch);

    // 将偏移四元数应用到最终的旋转
    Cesium.Quaternion.multiply(rotation, offsetQuaternion, result);

    return result;
  }

  /**
   * Compares this property to the provided property and returns
   * <code>true</code> if they are equal, <code>false</code> otherwise.
   *
   * @param {Property} [other] The other property.
   * @returns {boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
   */
  equals(other: Cesium.Property): boolean {
    return (
      this === other ||
      (other instanceof CustomVelocityOrientationProperty &&
        Cesium.Property.equals(this._velocityVectorProperty, other._velocityVectorProperty) &&
        (this._ellipsoid === other._ellipsoid || this._ellipsoid.equals(other._ellipsoid)) &&
        this._modelOffsetAngle === other._modelOffsetAngle)
    );
  }
}

export default CustomVelocityOrientationProperty;
