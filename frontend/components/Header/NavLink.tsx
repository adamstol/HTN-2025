import { forwardRef, type ComponentPropsWithRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { twMerge } from "tailwind-merge";
export interface NavLinkProps extends ComponentPropsWithRef<"a"> {
  href: string;
  isActive: boolean;
  isBelowHeader?: boolean;
  newTab?: boolean;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>((props, ref) => {
  const { 
    href, 
    isActive, 
    className, 
    isBelowHeader, 
    newTab, 
    id: propId,
    ...rest 
  } = props;

  const activeClassName = isActive ? twMerge("dark:bg-white/10", isBelowHeader ? " bg-white/40" : " bg-black/10") : "";

  const linkClassName = cn(
    "block px-3.5 sm:px-6 py-1 sm:py-1.5 max-sm:text-xs max-md:text-sm font-medium rounded-full text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 transition ease-in-out whitespace-nowrap",
    activeClassName,
    className
  );

  const commonProps = {
    ref,
    className: linkClassName,
    ...(propId && { id: String(propId) }), // Ensure id is a string
    ...rest
  };

  if (newTab) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        {...commonProps}
      />
    );
  }

  return (
    <Link
      href={href}
      {...commonProps}
    />
  );
});

NavLink.displayName = "NavLink";
export default NavLink;
