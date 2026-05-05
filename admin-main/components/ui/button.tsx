import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-slate-800 text-white hover:bg-slate-700",
        outline: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
        destructive: "bg-red-600 text-white hover:bg-red-700",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-10 px-4",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const textMap: Record<string, string> = {
  Save: "Lưu",
  Cancel: "Hủy",
  "Back to menu": "Về menu",
  "Back to Menu": "Về menu",
  Back: "Quay lại",
  Edit: "Sửa",
  Delete: "Xóa",
  Remove: "Gỡ",
  Update: "Cập nhật",
  Create: "Tạo mới",
  Search: "Tìm kiếm",
  Submit: "Xác nhận",
  Confirm: "Đồng ý",
  Close: "Đóng",
  Add: "Thêm",
};

function normalizeVietnameseText(children: React.ReactNode) {
  if (typeof children === "string") {
    const trimmed = children.trim();
    return textMap[trimmed] ?? trimmed;
  }
  return children;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const normalizedChildren = normalizeVietnameseText(children);

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {normalizedChildren}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { buttonVariants };