# 🚀 Deploy Automation Scripts

Scripts automatizados para validar deployments.

## Quick Usage

```bash
# Security validation
npm run deploy:security

# Full deployment checklist
npm run deploy:check

# Validate production
npm run deploy:validate

# Smoke tests
npm run deploy:smoke

# Full deployment flow
npm run deploy:full
```

## Scripts

### `/scripts/deploy-checklist.sh`
Complete pre-deploy validation

### `/scripts/security-check.sh`
Security scanning

### `/scripts/validate-production.sh`
Production health check

### `/scripts/smoke-test.sh`
Functional tests

## Workflow

1. `npm run deploy:security` - Check security
2. `npm run deploy:check` - Full validation
3. `git push origin main` - Deploy
4. Wait 30s-1min
5. `npm run deploy:validate` - Validate prod
6. `npm run deploy:smoke` - Smoke tests

## Exit Codes

- `0` = Success
- `1` = Failure

---

Ver `/scripts/README.md` e `DEPLOY_CHECKLIST.md` para detalhes completos.
