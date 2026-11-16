import { oauthConfig } from "@/lib/env";
import { META_CALLBACK_PATH } from "@/lib/social/connect";

/**
 * The redirect address for the Meta connect: this app's own origin, taken from the registered sign-in callback, so
 * the connect start and its completion send the same address and neither trusts what a request says its host is.
 * The signed-in session lives in this origin's cookies, so Meta must return here.
 */
export const metaRedirectUri = () => `${oauthConfig.appOrigin}${META_CALLBACK_PATH}`;
