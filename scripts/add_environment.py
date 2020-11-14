#!/usr/bin/python3
# vim: si:ts=2:sts=2:sw=2

import argparse
import collections
import toml


class attrdict(dict):

  def __init__(self, *args, **kwargs):
    super().__init__(*args, **kwargs)
    self.__dict__ = self


def add_environment(env):
  with open('wrangler.toml', 'rt') as f:
    conf = toml.load(f, _dict=attrdict)

  if env in conf.env and any(conf.env[env].values()):
    raise Exception('Environment already exists!')
  if env not in conf.env:
    conf.env[env] = attrdict()
  e = conf.env[env]

  for k, v in conf.env.template.items():
    if k in e:
      continue
    if isinstance(v, str):
      v = v.format(env)
    e[k] = v

  data = toml.dumps(conf)
  with open('wrangler.toml', 'wt') as f:
    print(data, end='', file=f)


def main():
  parser = argparse.ArgumentParser()
  parser.add_argument('env')
  args = parser.parse_args()
  add_environment(args.env)


if __name__ == '__main__':
  main()

