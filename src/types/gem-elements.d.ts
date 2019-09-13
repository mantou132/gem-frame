import { Route } from '@mantou/gem/elements/route';
import { Link } from '@mantou/gem/elements/link';
import { Title } from '@mantou/gem/elements/title';
import { Use } from '@mantou/gem/elements/use';

declare global {
  interface HTMLElementTagNameMap {
    'gem-route': Route;
    'gem-link': Link;
    'gem-title': Title;
    'gem-use': Use;
  }
}
