import React from "react"

export interface BrandMarkProps {
  showText?: boolean
  text?: string
  size?: "sm" | "md" | "lg"
  className?: string
  imageClassName?: string
  textClassName?: string
}

const brandSizes = {
  sm: {
    container: "gap-2",
    image: "h-8 w-8",
    text: "text-base",
  },
  md: {
    container: "gap-2.5",
    image: "h-10 w-10",
    text: "text-lg",
  },
  lg: {
    container: "gap-3",
    image: "h-14 w-14",
    text: "text-2xl",
  },
} as const

export const BrandMark: React.FC<BrandMarkProps> = ({
  showText = true,
  text = "G-FORCE",
  size = "md",
  className = "",
  imageClassName = "",
  textClassName = "",
}) => {
  const selectedSize = brandSizes[size]

  return (
    <div
      className={`inline-flex items-center ${selectedSize.container} ${className}`.trim()}
    >
      <img
        src="/logo.jpg"
        alt="Logo G-Force"
        className={`${selectedSize.image} object-cover rounded-md border border-[color:var(--app-border)] ${imageClassName}`.trim()}
      />
      {showText && (
        <span
          className={`font-bold tracking-wide text-[color:var(--app-text)] ${selectedSize.text} ${textClassName}`.trim()}
        >
          {text}
        </span>
      )}
    </div>
  )
}
