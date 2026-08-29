#!/usr/bin/env bash
set -euo pipefail

export JEKYLL_ENV=production
test_port="${PW_TEST_PORT:-4173}"
bundle exec jekyll build --destination .jekyll-test-site
exec bundle exec ruby -run -e httpd .jekyll-test-site -p "$test_port" -b 127.0.0.1
