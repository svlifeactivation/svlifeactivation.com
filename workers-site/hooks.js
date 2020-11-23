// vim: si:ts=2:sts=2:sw=2

export function pushHook(event, json) {
  const owner = 'svlifeactivation'
  const repo = 'svlifeactivation.com'

  const url = `https://api.github.com/repos/${owner}/${repo}/deployments`
  const headers = {
    'User-Agent': 'normanr-svlifeactivation-create-deployment-hook',
    'Authorization': 'token ' + DEPLOY_TOKEN,
		'Accept': 'application/vnd.github.v3+json',
  }
  const branch = json.ref.startsWith('refs/heads/') ? json.ref.slice('refs/heads/'.length) : json.ref
  const body = JSON.stringify({
    ref: json.ref,
    environment: branch,
  })
  console.log(body)
  return fetch(url, {
    method: 'POST',
    headers: headers,
    body: body,
  })
}
