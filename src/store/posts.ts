import { createStore, updateStore } from '@mantou/gem';

import * as api from '../service/api';

interface PostStore {
  list: api.Post[];
  loading: boolean;
}

export const posts = createStore<PostStore>({ list: [], loading: false });

export const fetchPosts = async () => {
  updateStore(posts, { loading: true });
  try {
    const list = await api.getPosts();
    await new Promise(resolve => setTimeout(resolve, 1000));
    updateStore(posts, { list });
  } finally {
    updateStore(posts, { loading: false });
  }
};
