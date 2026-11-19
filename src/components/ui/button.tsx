import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-on-accent font-semibold hover:brightness-95',
        outline: 'border border-line bg-card hover:bg-soft',
        soft: 'bg-accent-soft text-accent font-semibold',
        ghost: 'hover:bg-soft',
        link: 'text-accent underline underline-offset-3 p-0 h-auto',
        danger: 'text-danger hover:bg-soft',
      },
      size: {
        sm: 'h-7 rounded-lg px-2.5 text-xs',
        md: 'h-9 rounded-[10px] px-3.5 text-[13.5px]',
        lg: 'h-11 rounded-xl px-5 text-[15px]',
        icon: 'size-9 rounded-[11px] border border-line bg-card text-[17px]',
        none: '',
        mono: 'h-8 rounded-[10px] px-3 font-mono text-[11px] tracking-[0.06em] uppercase border border-line bg-card',
      },
    },
    defaultVariants: { variant: 'outline', size: 'md' },
  },
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }
export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  // Text links shouldn't inherit button height/padding.
  const sz = size ?? (variant === 'link' ? 'none' : undefined)
  return <Comp className={cn(buttonVariants({ variant, size: sz }), className)} {...props} />
}
export { buttonVariants }
