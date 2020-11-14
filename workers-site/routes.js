// vim: si:ts=2:sts=2:sw=2

import { getAssetFromKV } from '@cloudflare/kv-asset-handler'
import { pushHook } from './hooks'
import { Router } from './router'

export const router = new Router()
router.webhook('push', HOOK_SECRET, pushHook)
router.all(getAssetFromKV)
