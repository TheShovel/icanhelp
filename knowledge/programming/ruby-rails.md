# Ruby & Ruby on Rails

## Ruby
- Dynamic, interpreted, pure OOP (everything is object — even `nil`, numbers, strings; `5.times { print "hello" }`). Creator: Yukihiro "Matz" Matsumoto (1995). Designed for developer happiness: "Optimized for reading, not writing" — intention: code reads like natural language
  - Symbols (`:name`): immutable, reused, for identifiers. Blocks: `{ }` or `do end` (closures, pass to methods like `each`, `map`, `select`). Iterators: `array.each { |item| puts item }`. Mixin (modules: include — instance methods, extend — class methods). Duck typing: "if it walks like a duck..." — respond_to? determines capabilities
  - Gems: packages (RubyGems.org). Bundler: `Gemfile` → `bundle install`
  - Metaprogramming: powerful dynamic features — define_method, method_missing, const_missing, class_eval, instance_eval, send. Makes Rails DSL possible ("convention over configuration")
  - Testing: RSpec (behavior driven), Minitest (built-in)
  - RVM/rbenv/chruby: Ruby version managers. Bundler: Gemfile, gem versions locked in Gemfile.lock

## Rails
- **MVC**: Model (ActiveRecord — ORM: "object-relational mapping"; maps tables to classes, table names from class names: `User` → `users`), View (ERB templates — .html.erb, .json.jbuilder, .haml/.slim), Controller (handles requests, sets instance variables, renders/redirects). RESTful routes: `resources :users` → 8 standard routes (index, show, new, create, edit, update, destroy)
- **Convention over Configuration**: `User.find(params[:id])` — convention: model `User` maps to `users` table. No XML config (like Java/Spring). Generators scaffold with CL: `rails generate scaffold Post title:string body:text`
- **ActiveRecord**: validations (`validates :email, presence: true, uniqueness: true`). Associations (`belongs_to :user`, `has_many :posts`, `has_many :through`, `has_and_belongs_to_many`). Callbacks (`before_save :downcase_email`). Migrations (DB schema versioning `rails generate migration add_name_to_users name:string`). Query interface (`User.where(active: true).order(created_at: :desc).limit(10)`)
- **Rails 7/8**: Hotwire (Turbo + Stimulus — real-time updates without JS frameworks). Propel (Hotwire: Turbo drive — navigates via fetch + replaces body, Turbo frames — swaps specific page sections, Turbo Streams — WebSocket/broadcast updates). ActionCable (WebSockets). ActiveStorage (file uploads to S3/GCS/Azure). ActionMailbox (inbound email). ActionText (rich text editing). Good Job/Solid Queue (job backend)
  - Asset pipeline: Sprockets / Propshaft (plain CSS)
  - Request handling: Middleware stack + Rack interface
- **Testing**: RSpec + Capybara (integration), FactoryBot (test data), Shoulda Matchers, DatabaseCleaner. Selenium/Playwright for browser tests, or Cypress / Playwright outside Rails)
- **Gems**: Devise (auth), CanCanCan/Pundit (authorization), Sidekiq (background jobs with Redis), Ransack (search), ActiveAdmin (admin panel), PaperTrail (audit/versions), FriendlyId (URL slugs), Paperclip/Shrine (file uploads, ActiveStorage is now default), Stripe/Pay (payments)
- **Deployment**: Heroku (PaaS, simple, $7-500+/month), Hatchbox (Rails-specific, $10/server), Kamal (deploy containers to own servers via SSH — simple, no K8s). Render, Fly.io, Railway
