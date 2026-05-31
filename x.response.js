const body = $response.body || "";

const adKeyRe = /^(promotedMetadata|promotedContent|promoted_content|promotedTrend|promoted_trend|adMetadata|ad_metadata|advertiserInfo|advertiser_info)$/i;
const timelineArrayKeyRe = /^(entries|items|moduleItems|timelineItems)$/i;
const promotedEntryRe = /(^|[-_:])(promoted|advertised|ad)([-_:]|$)/i;

function isObject(value) {
  return value !== null && typeof value === "object";
}

function hasAdMarker(value, depth) {
  if (!isObject(value) || depth > 8) return false;

  for (const key of Object.keys(value)) {
    const child = value[key];

    if (adKeyRe.test(key) && child != null) return true;

    if (
      /^(entryId|entry_id|sortIndex|clientEventInfo|feedbackKeys)$/i.test(key) &&
      typeof child === "string" &&
      promotedEntryRe.test(child)
    ) {
      return true;
    }

    if (
      /^(contextType|disclosureType|labelType|socialContextType)$/i.test(key) &&
      typeof child === "string" &&
      /promoted/i.test(child)
    ) {
      return true;
    }

    if (isObject(child) && hasAdMarker(child, depth + 1)) return true;
  }

  return false;
}

function prune(value, key, depth) {
  if (!isObject(value) || depth > 60) return;

  if (Array.isArray(value)) {
    for (const item of value) prune(item, key, depth + 1);

    if (timelineArrayKeyRe.test(key)) {
      for (let index = value.length - 1; index >= 0; index--) {
        if (hasAdMarker(value[index], 0)) value.splice(index, 1);
      }
    }
    return;
  }

  for (const childKey of Object.keys(value)) {
    prune(value[childKey], childKey, depth + 1);
  }
}

try {
  const json = JSON.parse(body);
  prune(json, "", 0);
  $done({ body: JSON.stringify(json) });
} catch (error) {
  $done({ body });
}
