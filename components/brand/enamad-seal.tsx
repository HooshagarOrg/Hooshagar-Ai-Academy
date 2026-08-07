/**
 * نشان اعتماد اینماد — الزامی برای نمایش در فوتر عمومی
 */
export function EnamadSeal({ className = '' }: { className?: string }): JSX.Element {
  return (
    <a
      referrerPolicy="origin"
      target="_blank"
      rel="noopener noreferrer"
      href="https://trustseal.enamad.ir/?id=7213404&Code=GdmrGFomwTEcuHOMntNBlhwbUPb3LmNR"
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      aria-label="نماد اعتماد الکترونیکی"
      title="نماد اعتماد الکترونیکی"
    >
      {/* اینماد الزاماً از دامنهٔ رسمی خود لود می‌شود */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        referrerPolicy="origin"
        src="https://trustseal.enamad.ir/logo.aspx?id=7213404&Code=GdmrGFomwTEcuHOMntNBlhwbUPb3LmNR"
        alt="نماد اعتماد الکترونیکی"
        width={125}
        height={125}
        className="h-[72px] w-[72px] cursor-pointer object-contain sm:h-[88px] sm:w-[88px]"
        // ویژگی رسمی اینماد برای اعتبارسنجی نشان
        {...{ code: 'GdmrGFomwTEcuHOMntNBlhwbUPb3LmNR' }}
      />
    </a>
  )
}
