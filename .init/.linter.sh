#!/bin/bash
cd /home/kavia/workspace/code-generation/multi-tenant-accounts-management-platform-1063-1221/accounts_backend
npm run lint
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -ne 0 ]; then
  exit 1
fi

