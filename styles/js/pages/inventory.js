/* ==================================================================== */
/* Import Charadex
======================================================================= */
import { charadex } from '../charadex.js';

/* ==================================================================== */
/* Load
======================================================================= */
document.addEventListener("DOMContentLoaded", async () => {
  const t0 = performance.now();
  const log = (...args) => console.log('[inventory]', ...args);
  const warn = (...args) => console.warn('[inventory]', ...args);
  const err = (...args) => console.error('[inventory]', ...args);

  // ===== Debug helpers =====
  const safeLen = (v) => Array.isArray(v) ? v.length : (v ? '(not array)' : 0);
  const firstN = (arr, n=3) => Array.isArray(arr) ? arr.slice(0, n) : arr;
  const listKeys = (obj) => obj ? Object.keys(obj) : [];
  const previewArrays = (obj, regex=/design|master|log/i) => {
    if (!obj) return [];
    return Object.entries(obj)
      .filter(([k,v]) => regex.test(k) && Array.isArray(v))
      .map(([k,v]) => ({ key:k, length:v.length }));
  };
  const availableRelatedKeys = (rd) => rd ? Object.keys(rd) : [];

  log('DOMContentLoaded');

  try {
    let dex = await charadex.initialize.page(
      null,
      charadex.page.inventory,
      null,
      async (listData) => {
        const tList = performance.now();
        log('[cb] listData:', {
          type: listData?.type,
          pageUrl: listData?.pageUrl,
          hasArray: !!listData?.array,
          arrayLen: Array.isArray(listData?.array) ? listData.array.length : undefined,
          keys: Object.keys(listData || {})
        });

        if (listData.type === 'profile') {
          const profile = listData.profileArray?.[0];
          if (!profile) {
            warn('profileArray[0] is undefined');
            return;
          }
          log('[profile] id:', profile?.id, 'name:', profile?.name ?? profile?.username);
          log('[profile] keys:', listKeys(profile));
          log('[profile] array-candidates:', previewArrays(profile));

          // Inventory
          const invStart = performance.now();
          const fixedInv = await charadex.manageData.inventoryFix(profile);
          log('[inventoryFix] type:', Array.isArray(fixedInv) ? 'array' : typeof fixedInv, 'items:', safeLen(fixedInv), 'sample:', firstN(fixedInv));
          await charadex.initialize.groupGallery(
            charadex.page.inventory.inventoryConfig,
            fixedInv,
            'type',
            charadex.url.getPageUrl('items')
          );
          log('[groupGallery] done in', (performance.now() - invStart).toFixed(1), 'ms');

          // ===== Designs (강화 로깅) =====
          (async () => {
            const pageCfg = charadex.page.masterlist; // UI/페이지 설정
            const relatedKeyComputed = charadex.sheet?.pages?.masterlist; // 계산된 키 (중요)
            const profileKey = pageCfg?.profileProperty || 'design';

            log('[designs][cfg]', {
              profileProperty: profileKey,
              relatedKeyComputed,
              pageCfgKeys: listKeys(pageCfg),
            });
            log('[designs][inventory.relatedData] keys:', availableRelatedKeys(charadex.page.inventory?.relatedData));

            const designsArray =
              profile?.[profileKey] ??
              profile?.design ??
              profile?.masterlist ??
              null;

            if (Array.isArray(designsArray)) {
              log('[designs] array found via', designsArray === profile?.[profileKey] ? profileKey : (designsArray === profile?.design ? 'design' : 'masterlist'),
                  'length:', designsArray.length,
                  'sample:', firstN(designsArray));

              const relatedCfg =
                charadex.page.inventory?.relatedData?.[relatedKeyComputed] // 인벤토리에서 오버라이드된 설정
                ?? pageCfg;                                               // 없으면 기본 masterlist 설정

              log('[designs] using relatedCfg from',
                  charadex.page.inventory?.relatedData?.[relatedKeyComputed] ? 'inventory.relatedData[computedKey]' : 'page.masterlist',
                  'relatedCfg.keys:', listKeys(relatedCfg));

              const dStart = performance.now();
              const designs = await charadex.initialize.page(
                designsArray,
                relatedCfg,
              );
              log('[designs] initialize.page result:', designs, 'in', (performance.now() - dStart).toFixed(1), 'ms');
            } else {
              warn('[designs] NO ARRAY. Diagnostics:', {
                triedKey: profileKey,
                has_profileKey: !!profile?.[profileKey],
                typeof_profileKey: typeof profile?.[profileKey],
                has_design: !!profile?.design,
                has_masterlist: !!profile?.masterlist,
                candidates: previewArrays(profile),
              });
              log('[designs] no masterlist');
            }
          })();

          // ===== Logs (강화 로깅) =====
          (async () => {
            const invRelatedKeys = availableRelatedKeys(charadex.page.inventory?.relatedData);
            log('[logs][inventory.relatedData] keys:', invRelatedKeys);

            // relatedData 키가 문자열이 아닌 "계산된 키"를 쓰는 경우가 있어서 후보 전수검사
            const logKeyCandidates = ['inventory log', 'log', charadex.sheet?.pages?.masterlistLog].filter(Boolean);
            let relatedLogCfg = null;
            let chosenLogKey = null;
            for (const k of logKeyCandidates) {
              if (k in (charadex.page.inventory?.relatedData || {})) {
                relatedLogCfg = charadex.page.inventory.relatedData[k];
                chosenLogKey = k;
                break;
              }
            }
            log('[logs] chosen relatedData key:', chosenLogKey, 'fallbacks:', logKeyCandidates);

            const logsArray =
              profile?.inventorylog ??
              profile?.logs ??
              null;

            if (Array.isArray(logsArray)) {
              const lStart = performance.now();
              log('[logs] array length:', logsArray.length, 'sample:', firstN(logsArray));
              const logsRes = await charadex.initialize.page(
                logsArray,
                relatedLogCfg ?? charadex.page.masterlist?.relatedData?.[charadex.sheet?.pages?.masterlistLog] ?? charadex.page.masterlist,
              );
              log('[logs] initialize.page result:', logsRes, 'in', (performance.now() - lStart).toFixed(1), 'ms');
            } else {
              log('[logs] no inventorylog. candidates:', previewArrays(profile, /log|history|trace/i));
            }
          })();

        } else {
          log('[cb] non-profile type:', listData.type);
        }

        log('[cb] handled in', (performance.now() - tList).toFixed(1), 'ms');
      }
    );

    log('[initialize.page] returned:', dex, 'in', (performance.now() - t0).toFixed(1), 'ms');

    const softStart = performance.now();
    charadex.tools.loadPage('.softload', 500);
    log('[loadPage] .softload scheduled (500ms), call took', (performance.now() - softStart).toFixed(1), 'ms');
  } catch (e) {
    err('Unhandled error:', e);
  }
});
