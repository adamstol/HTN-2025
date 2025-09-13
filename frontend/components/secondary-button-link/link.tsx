"use client";
import Link from "next/link";

import { cn, buttonVariants } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";
import styles from "./styles.module.css";

function Component({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Link>) {


  return (
    <Link
      className={cn(buttonVariants({ variant: "secondary" }), styles.cta, className)}
      {...props}
    >
      <span>{props.children}</span>
    </Link>
  );
}

export default Component;
