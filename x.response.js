const body = $response.body || "";

const adKeyRe = /^(promotedMetadata|promotedContent|promoted_content|promotedTrend|promoted_trend|adMetadata|ad_metadata|advertiserInfo|advertiser_info)$/i;
const timelineArrayKeyRe = /^(entries|items|moduleItems|timelineItems|modules|tweets|results)$/i;
const promotedEntryRe = /(^|[-_:])(promoted|advertised|ad)([-_:]|$)/i;

function isObject(value) {
  return value !== null && typeof value === "object";
}

function hasAdMarker(value, depth = 0) {
  if (!isObject(value) || depth > 10) return false;

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

function clean(value, key = "") {
  if (Array.isArray(value)) {
    const cleaned = value.map((item) => clean(item, key));
    return timelineArrayKeyRe.test(key)
      ? cleaned.filter((item) => !hasAdMarker(item))
      : cleaned;
  }

  if (!isObject(value)) return value;

  const output = {};
  for (const childKey of Object.keys(value)) {
    if (adKeyRe.test(childKey)) continue;
    output[childKey] = clean(value[childKey], childKey);
  }
  return output;
}

try {
  const json = JSON.parse(body);
  $done({ body: JSON.stringify(clean(json)) });
} catch (error) {
  $done({ body });
}
