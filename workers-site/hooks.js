// vim: si:ts=2:sts=2:sw=2

export async function pushHook(event, json) {
  const owner = 'svlifeactivation'
  const repo = 'svlifeactivation.com'
  const workflow_id = 'create-deployment.yml'

  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow_id}/dispatches`
  const headers = {
    'User-Agent': 'normanr-svlifeactivation-create-deployment-hook',
    'Authorization': 'token ' + DEPLOY_TOKEN,
  }
  const branch = json.ref.startsWith('refs/heads/') ? json.ref.slice('refs/heads/'.length) : json.ref
  const body = JSON.stringify({
    ref: 'www',
    inputs: {
      'branch': branch,
    },
  })
  console.log(body)
  return fetch(url, {
    method: 'POST',
    headers: headers,
    body: body,
  })
}
