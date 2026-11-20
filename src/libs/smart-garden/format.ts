/** 后端与 Mock 统一存 UTC ISO 串，展示时需转本地时区，否则时钟差 8 小时 */
export function fmtIsoTime(iso: string | undefined | null): string {
  if (!iso) return '--:--:--'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
