## 🐞 ISSUE\_01.md – Fix "useAuth must be used within an AuthProvider" Error on /admin

### FEATURE:

Resolve the runtime error that occurs when navigating to **/admin**:

```
Error: useAuth must be used within an AuthProvider
```

This happens because the `Layout` (or a child) calls `useAuth()` but is rendered **outside** the `<AuthProvider>` context.

### EXAMPLES:

* Reference `examples/AuthProviderWrapper.tsx` for correct provider wiring in tests.
* See how `App.tsx` wraps `BrowserRouter` with `QueryClientProvider` – mimic that pattern for `AuthProvider`.

### DOCUMENTATION:

* `/docs/API.md` – Auth flow overview.
* `CLAUDE.md` – component size & hook rules.
* `PLANNING.md` – Auth module details (M1\_PHASE\_01).

### OTHER CONSIDERATIONS:

* Ensure **only one** AuthProvider wraps the whole React tree to avoid duplicate context.
* Add a Jest + React Testing Library test to assert /admin renders without throwing.
* Verify that widget bundle **does not** include AuthProvider (widget is public).

---

### TASK CHECKLIST

* [ ] **Audit App Entry**: ensure `<AuthProvider>` wraps `<Router>` & other providers in `main.tsx` or `App.tsx`.
* [ ] **Refactor Layout**: remove redundant AuthProvider refs if any.
* [ ] **Route Guard**: add `<RequireAuth>` HOC for /admin routes to redirect to /login if unauthenticated.
* [ ] **Test**: add `AdminPage.test.tsx` that renders App with mocked AuthProvider and expects heading “Dashboard”.
* [ ] **Docs**: update `/docs/README.md` quick‑start if entry file changed.

```bash
# Validation Loop
npm run lint
npm run type-check
npm run test:unit  # includes AdminPage.test.tsx
npm run dev        # navigate to /admin – no error
```

#### Success Criteria

* /admin route renders Layout without error.
* Unauthorized users hitting /admin are redirected to /login.
* New unit test passes; coverage unchanged or improved.
* No additional provider duplication in component tree.
* Documentation updated in /docs
---


