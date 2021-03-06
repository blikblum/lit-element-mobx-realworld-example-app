import 'components/red-error'
import 'components/loading-spinner'
import ArticleList from 'components/ArticleList'
import { Component, html } from 'components/base'
import { bindRouterLinks } from 'slick-router/middlewares/router-links'

const EditProfileSettings = props => {
  if (props.isUser) {
    return html`
      <a href="#settings" class="btn btn-sm btn-outline-secondary action-btn"
        ><i class="ion-gear-a"></i> Edit Profile Settings</a
      >
    `
  }
  return null
}

const FollowUserButton = props => {
  if (props.isUser) {
    return null
  }

  let classes = 'btn btn-sm action-btn'
  if (props.following) {
    classes += ' btn-secondary'
  } else {
    classes += ' btn-outline-secondary'
  }

  const handleClick = ev => {
    ev.preventDefault()
    if (props.following) {
      props.unfollow(props.username)
    } else {
      props.follow(props.username)
    }
  }

  return html`
    <button class=${classes} @click=${handleClick}>
      <i class="ion-plus-round"></i> ${props.following ? 'Unfollow' : 'Follow'}
      ${props.username}
    </button>
  `
}

class ProfilePage extends Component {
  static observedContexts = ['stores']

  static properties = {
    username: { type: String },
    pathname: { type: String }
  }

  set $route(value) {
    this.username = value.params.username
    this.pathname = value.pathname
  }

  updated() {
    // wait to routerlinks root el be rendered
    if (!this.disposeRouterLinks) {
      const rootEls = this.querySelector('[routerlinks]')
      if (rootEls) this.disposeRouterLinks = bindRouterLinks(this)
    }
  }

  connectedCallback() {
    super.connectedCallback()
    this.context.stores.articlesStore.setPredicate(this.getPredicate())
    this.context.stores.profileStore.loadProfile(this.username)
    this.context.stores.articlesStore.loadArticles()
    this.dataLoaded = true
  }

  disconnectedCallback() {
    if (this.disposeRouterLinks) {
      this.disposeRouterLinks()
    }
  }

  shouldUpdate(changedProperties) {
    // avoid reloading data just after connect
    if (this.dataLoaded) {
      this.dataLoaded = false
      return true
    }

    if (changedProperties.has('username')) {
      this.context.stores.profileStore.loadProfile(this.username)
    }

    if (changedProperties.has('pathname')) {
      this.context.stores.articlesStore.setPredicate(this.getPredicate())
      this.context.stores.articlesStore.loadArticles()
    }
    return true
  }

  getTab() {
    if (/\/favorites/.test(this.pathname)) return 'favorites'
    return 'all'
  }

  getPredicate() {
    switch (this.getTab()) {
      case 'favorites':
        return { favoritedBy: this.username }
      default:
        return { author: this.username }
    }
  }

  handleFollow = () => this.context.stores.profileStore.follow()
  handleUnfollow = () => this.context.stores.profileStore.unfollow()

  handleSetPage = page => {
    this.context.stores.articlesStore.setPage(page)
    this.context.stores.articlesStore.loadArticles()
  }

  renderTabs() {
    const { profile } = this.context.stores.profileStore
    const isFavorites = this.pathname.match('/favorites')
    return html`
      <ul class="nav nav-pills outline-active" routerlinks>
        <li class="nav-item">
          <a
            class=${`nav-link ${!isFavorites ? 'active' : ''}`}
            route="profile"
            param-username=${profile.username}
            exact
            >My Articles</a
          >
        </li>
        <li class="nav-item">
          <a
            class="nav-link"
            route="profile.favorites"
            param-username=${profile.username}
            >Favorited Articles</a
          >
        </li>
      </ul>
    `
  }

  render() {
    const { profileStore, articlesStore, userStore } = this.context.stores
    const { profile, isLoadingProfile } = profileStore
    const { currentUser } = userStore

    if (isLoadingProfile && !profile)
      return html`
        <loading-spinner></loading-spinner>
      `
    if (!profile)
      return html`
        <red-error message="Can't load profile"></red-error>
      `

    const isUser = currentUser && profile.username === currentUser.username

    return html`
      <div class="profile-page">
        <div class="user-info">
          <div class="container">
            <div class="row">
              <div class="col-xs-12 col-md-10 offset-md-1">
                <img src=${profile.image} class="user-img" alt="" />
                <h4>${profile.username}</h4>
                <p>${profile.bio}</p>
                ${EditProfileSettings({ isUser })}
                ${FollowUserButton({
                  isUser,
                  username: profile.username,
                  following: profile.following,
                  unfollow: this.handleUnfollow,
                  follow: this.handleFollow
                })}
              </div>
            </div>
          </div>
        </div>
        <div class="container">
          <div class="row">
            <div class="col-xs-12 col-md-10 offset-md-1">
              <div class="articles-toggle">${this.renderTabs()}</div>
              ${ArticleList({
                articles: articlesStore.articles,
                totalPagesCount: articlesStore.totalPagesCount,
                onSetPage: this.handleSetPage,
                loading: articlesStore.isLoading
              })}
            </div>
          </div>
        </div>
      </div>
    `
  }
}

customElements.define('profile-page', ProfilePage)
