#!/usr/bin/python3
# vim: si:ts=2:sts=2:sw=2

import argparse
import ast
import base64
import fnmatch
import hashlib
import json
import mimetypes
import os
import re
import shutil
import string
import toml


class attrdict(dict):

  def __init__(self, *args, **kwargs):
    super().__init__(*args, **kwargs)
    self.__dict__ = self


class FormattingTemplate(string.Template):

  braceidpattern = '[^}]*'

  def substitute(self, context, **kwargs):
    context = dict(context, **kwargs)
    class Proxy:
      @staticmethod
      def __getitem__(name):
        name, _, format_spec = name.partition(':')
        return self.format_field(context[name], format_spec)
    return super().substitute(Proxy())


class JSONTemplate(FormattingTemplate):

  def format_field(self, value, format_spec):
    def parse_kwarg(kwarg):
      k, s, v = kwarg.partition('=')
      return k, ast.literal_eval(v) if s else None
    kwargs = dict((parse_kwarg(kwarg)
                   for kwarg in format_spec.split(',')
                   if kwarg))
    return json.dumps(value, **kwargs)


def apply_gitignore(path, dirs, files):
  # This isn't perfect and could be replaced with pathspec.
  ignore = ['.*']
  if '.gitignore' in files:
    with open(os.path.join(path, '.gitignore'), 'rt') as f:
      ignore.extend(l.rstrip() for l in f.readlines())
  rei = re.compile('|'.join(fnmatch.translate(i) for i in ignore))
  files[:] = [f for f in files if rei.match(f) is None]
  dirs[:] = [d for d in dirs if rei.match(d) is None]


def generate_site(bucket):
  manifest = {}
  content = []
  b64content = []

  plen = len(os.path.join(bucket, ''))
  for root, dirs, files in os.walk(bucket):
    apply_gitignore(root, dirs, files)
    for fn in files:
      n = os.path.join(root, fn)
      with open(n, 'rb') as f:
        d = f.read()
      jh = hashlib.sha1(d).hexdigest()
      manifest[n[plen:]] = jh
      mimetype, encoding = mimetypes.guess_type(n, strict=True)
      metadata = {'Content-Type': mimetype}
      try:
        content.append((jh, d.decode('utf8'), metadata))
      except UnicodeDecodeError:
        b64content.append((jh, base64.b64encode(d).decode('ascii'), metadata))

  assert manifest, 'Generated manifest is empty!'
  return dict(content=content, b64content=b64content, manifest=manifest)


def build_site(dstdir):
  with open('wrangler.toml', 'rt') as f:
    conf = toml.load(f, _dict=attrdict)
  srcdir = conf.site.get('entry-point', 'workers-site')
  with open(os.path.join(srcdir, 'package.json'), 'rt') as f:
    package = json.load(f, object_hook=attrdict)
  with open(os.path.join(os.path.dirname(__file__), 'site-tmpl.js'), 'rt') as f:
    template = f.read()

  site = generate_site(conf.site.bucket)
  data = JSONTemplate(template).substitute(site, package=package)

  del conf.site
  package.main = 'site.js'

  os.makedirs(dstdir, exist_ok=True)
  with open(os.path.join(dstdir, 'wrangler.toml'), 'wt') as f:
    toml.dump(conf, f)
  with open(os.path.join(dstdir, 'package.json'), 'wt') as f:
    json.dump(package, f)
  with open(os.path.join(dstdir, package.main), 'wt') as dst:
    print(data, end='', file=dst)

  def update_link(filename):
    if (os.path.lexists(os.path.join(dstdir, filename)) and
        os.path.islink(os.path.join(dstdir, filename))):
      os.unlink(os.path.join(dstdir, filename))
    if os.path.exists(os.path.join(srcdir, filename)):
      os.symlink(os.path.relpath(os.path.join(srcdir, filename), dstdir),
                 os.path.join(dstdir, filename))

  files = os.listdir(srcdir)
  files.remove('package.json')
  apply_gitignore(srcdir, [], files)

  for f in files:
    update_link(f)
  update_link('.gitignore')
  update_link('node_modules')


def main():
  parser = argparse.ArgumentParser()
  parser.add_argument('dstdir')
  args = parser.parse_args()
  build_site(args.dstdir)


if __name__ == '__main__':
  main()
