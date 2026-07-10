# Angular

TypeScript-based web application framework by Google for building SPAs.

## Core Concepts
- **Components**: Building blocks — `@Component({ selector: 'app-root', template: '...', styles: [...] })`. Class + template + styles. Lifecycle hooks: `ngOnInit`, `ngOnChanges`, `ngOnDestroy`, `ngAfterViewInit`, `ngDoCheck`
- **Modules (NgModule)**: `@NgModule({ declarations: [...], imports: [...], providers: [...], bootstrap: [...] })`. Organize app into cohesive blocks. Standalone components (Angular 14+) remove need for modules
- **Templates**: HTML with Angular directives — `*ngIf`, `*ngFor`, `*ngSwitch`. Property binding `[property]`, event binding `(event)`, two-way `[(ngModel)]`. Template reference variables `#myVar`
- **Directives**: Structural (`*ngIf`, `*ngFor` — modify DOM layout). Attribute (`[ngClass]`, `[ngStyle]` — change appearance). Custom directives via `@Directive`
- **Pipes**: Transform data in template — `{{ date | date:'short' }}`, `{{ value | currency:'USD' }}`, `{{ text | uppercase }}`. Async pipe `{{ observable$ | async }}` handles subscription/unsubscription automatically

## RxJS & Observables
- **Observable**: Stream of values over time — HTTP requests, user events, WebSocket messages. Lazy — nothing happens until subscription. Operators transform streams
- **Key operators**: `map` (transform values), `filter`, `tap` (side effects), `switchMap` (switch to new inner observable — HTTP requests), `debounceTime` (typeahead), `catchError`, `retry`, `combineLatest`, `forkJoin` (wait for all to complete)
- **Subject**: Multicast — multiple subscribers share execution. `BehaviorSubject` (requires initial value, emits current value on subscribe — for state). `ReplaySubject` (replays last N values). `AsyncSubject` (emits only last value on complete)
- **Subscriptions**: Always unsubscribe to prevent memory leaks — use `AsyncPipe` (preferred), `takeUntil(destroy$)`, or `Subscription.add()`. Manual `unsubscribe()` in `ngOnDestroy`
- **HttpClient**: Built-in for API calls — `this.http.get<User[]>('/api/users')`. Returns Observable. Interceptors: modify requests/responses globally (auth tokens, logging, error handling)

## Services & Dependency Injection
- **Services**: `@Injectable({ providedIn: 'root' })` — singleton across app. `providedIn: 'any'` — new instance per lazy module. Register in module `providers` array for scoped services
- **DI hierarchy**: Component → Module → Root. Each injector caches instances. Hierarchical: if component provides service, child components get that instance (not parent's)
- **Injection tokens**: `@Inject(TOKEN)` for non-class dependencies (config objects, API URLs). `InjectionToken<T>` provides type safety
- **Tree-shakeable providers**: `providedIn: 'root'` allows tree-shaking — if service never injected, it's excluded from bundle

## Forms
- **Template-driven forms**: `[(ngModel)]` for two-way binding. Simple, less code. Validation via directives (required, minlength, pattern). Add `FormsModule` to imports
- **Reactive forms**: More flexible, testable — `FormGroup`, `FormControl`, `FormArray`. FormBuilder: `fb.group({ name: ['', Validators.required], email: ['', [Validators.email]] })`. Async validators for server-side validation
- **Validation**: Built-in validators (required, minLength, maxLength, pattern, email). Custom validators: function returning `{ [key: string]: any } | null`. Async validators return Promise/Observable
- **Form submission**: `(ngSubmit)="onSubmit()"`. Disabled button while submitting. Show field errors after user touches field (`submitted` flag or `field.touched`)

## Routing
- **RouterModule**: `RouterModule.forRoot(routes)` for app, `forChild(routes)` for feature modules. Route: `{ path: 'users/:id', component: UserDetailComponent, canActivate: [AuthGuard], resolve: { user: UserResolver } }`
- **Lazy loading**: `{ path: 'admin', loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule) }` — loads on demand, reduces initial bundle size
- **Guards**: `CanActivate` (allow/deny), `CanActivateChild`, `CanDeactivate` (prevent unsaved changes), `Resolve` (pre-fetch data), `CanLoad` (prevent lazy module loading)
- **Router events**: NavigationStart, RouteConfigLoadStart, ResolveStart, ActivationStart, NavigationEnd, NavigationError, NavigationCancel. `router.events.pipe(filter(e => e instanceof NavigationEnd))`
- **Route params**: `ActivatedRoute` — `paramMap` (params), `queryParamMap`, `data` (static/resolved data), `snapshot` (initial values). Subscribe to param changes

## Change Detection
- **Zone.js**: Monkey-patches browser APIs (setTimeout, addEventListener, XMLHttpRequest) → triggers change detection on async operations. Default: checks entire component tree
- **OnPush strategy**: `changeDetection: ChangeDetectionStrategy.OnPush` — only check component when: input reference changes, event originates from component, observable emits (with async pipe). Reduces checks dramatically
- **TrackBy in ngFor**: `trackBy: trackById` — track items by ID, not by index. Prevents re-rendering unchanged items when list changes. Critical for performance with large lists
- **Detaching change detector**: `ChangeDetectorRef.detach()` — manual control. `detectChanges()` triggers local check. `reattach()` reconnects. For heavy animation or WebSocket streams

## Performance Optimization
- **Lazy loading**: Feature modules loaded on demand. Reduces initial bundle size. Use `loadChildren` for routes
- **AOT compilation**: Ahead-of-Time — compiles during build. Smaller bundles, faster rendering, template errors caught at build time. Default in production builds. JIT for development only
- **Tree shaking**: Unused code eliminated by build (Webpack/ESBuild). Services with `providedIn: 'root'` can be tree-shaken if unused
- **Virtual scrolling**: `@angular/cdk/scrolling` — `cdk-virtual-scroll-viewport` renders only visible items. For lists with 1000+ items. CDK provides native-scrolling and fixed-size strategies
- **Image optimization**: `NgOptimizedImage` directive — lazy loading, priority hints, srcset generation. Load hero images with `priority`, defer below-fold images

## Testing
- **Jasmine + Karma**: Default. `describe`, `it`, `expect`. `TestBed.configureTestingModule({...})`. `fixture = TestBed.createComponent(MyComponent)`. `fixture.detectChanges()` triggers change detection
- **Component test**: Test inputs (`@Input`), outputs (`@Output` emits), template rendering (`fixture.nativeElement.querySelector`). Mock services with `TestBed.overrideProvider`
- **Http testing**: `HttpClientTestingModule` + `HttpTestingController`. `expectOne('/api/url').flush(mockData)`. Verify no outstanding requests: `httpMock.verify()`
- **E2E**: Protractor (legacy) vs Cypress / Playwright (recommended). Test user flows, navigation, form submission
