"use client";

import PageContent from "@/components/pages/page-content";
import type { Page } from "@/lib/types";

type PublicPageProps = {
  page: Page;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function PublicPage({
  page,
}: PublicPageProps) {
  return (
    <main className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <article className="mx-auto max-w-5xl">
        <div className="glass-strong rounded-3xl p-6 sm:p-8 lg:p-10">
          <header className="border-b border-white/70 pb-6">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
              {page.title}
            </h1>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-zinc-500">
              <span>
                Created{" "}
                {formatDate(page.createdAt)}
              </span>

              <span>
                Updated{" "}
                {formatDate(page.updatedAt)}
              </span>
            </div>
          </header>

          <div className="mt-8">
            <PageContent content={page.content} />
          </div>
        </div>
      </article>
    </main>
  );
}