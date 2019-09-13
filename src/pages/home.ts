import { GemElement, html, repeat } from '@mantou/gem';

import { posts, fetchPosts } from '../store/posts';

class Home extends GemElement {
  static observedStores = [posts];
  mounted() {
    fetchPosts();
  }
  render() {
    return html`
      ${posts.loading
        ? 'loading...'
        : html`
            <ul>
              ${repeat(
                posts.list,
                ({ id }) => id,
                ({ body }) => html`
                  <li>${body}</li>
                `,
              )}
            </ul>
          `}
    `;
  }
}

customElements.define('app-home', Home);
