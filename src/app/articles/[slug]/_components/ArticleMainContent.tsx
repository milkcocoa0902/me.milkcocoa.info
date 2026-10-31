import { ArticleDevWatcher } from "./ArticleDevWatcher";
import { ArticleHtml } from "./ArticleHtml";

export const ArticleBody: React.FC<{ html: string }> = (params) => {
    return (
        <>
            {process.env.NODE_ENV !== "production" ? <ArticleDevWatcher /> : null}
            <ArticleHtml
                className="prose prose-invert max-w-none mx-auto prose-headings:text-slate-50 prose-h1:text-3xl prose-h2:border-b prose-h2:border-slate-800 prose-h2:pb-2 prose-h2:text-2xl prose-p:leading-7 prose-p:text-slate-200 prose-strong:text-slate-100 prose-li:text-slate-200 prose-a:text-cyan-300 hover:prose-a:text-cyan-200 prose-code:text-teal-200 prose-pre:bg-transparent prose-pre:px-4"
                html={params.html}
            />
        </>
    )
}
