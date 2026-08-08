import { ArticleDevWatcher } from "./ArticleDevWatcher";

export const ArticleBody: React.FC<{ html: string }> = (params) => {
    return (
        <>
            {process.env.NODE_ENV !== "production" ? <ArticleDevWatcher /> : null}
            <div
                className="prose prose-invert max-w-none mx-auto prose-headings:text-white prose-h1:text-4xl prose-h2:text-3xl prose-headings:underline prose-p:text-slate-200 prose-strong:text-slate-100 prose-li:text-slate-200 prose-a:text-cyan-300 hover:prose-a:text-cyan-200 prose-pre:bg-transparent prose-pre:px-4"
                dangerouslySetInnerHTML={{__html: params.html}}
            />
        </>
    )
}
