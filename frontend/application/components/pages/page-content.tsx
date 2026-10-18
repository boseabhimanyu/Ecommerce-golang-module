"use client";

import { useMemo } from "react";

import { sanitizeHtml } from "@/lib/sanitize-html";
import styles from "../../app/(website)/[slug]/editor-typography.module.css"
import "../../styles/page-custom-styles.css"

type PageContentProps = {
  content: string;
};

export default function PageContent({
  content,
}: PageContentProps) {
  const safeHtml = useMemo(
    () => sanitizeHtml(content),
    [content],
  );

  return (
    <div
      className={styles.typographyContainer}
      dangerouslySetInnerHTML={{
        __html: safeHtml,
      }}
    />
  );
}