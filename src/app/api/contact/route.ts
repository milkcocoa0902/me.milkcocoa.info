import "server-only";
import {handleContact} from "@/lib/server/contact/handler";
import {getCloudflareContext} from "@opennextjs/cloudflare";
import {createStoredDelivery} from "@/lib/server/contact/storage";
import {createTurnstileVerifier} from "@/lib/server/contact/turnstile";
import {createNotifier} from "@/lib/server/contact/notify";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const {env} = await getCloudflareContext({async: true});
        return await handleContact(request, {
            enabled: true,
            origin: "https://me.milkcocoa.info",
            verify: createTurnstileVerifier(env.TURNSTILE_SECRET_KEY, "me.milkcocoa.info"),
            deliver: createStoredDelivery({db: env.CONTACT_DB, emailKey: env.CONTACT_EMAIL_ENCRYPTION_KEY, notify: createNotifier(env)}),
        });
    } catch {
        return Response.json({status: "error", code: "unavailable"}, {status: 503, headers: {"Cache-Control": "no-store"}});
    }
}
