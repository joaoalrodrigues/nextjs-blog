import { GetStaticProps } from 'next';
import Link from 'next/link';

import Prismic from '@prismicio/client';
import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<PostPagination>(postsPagination);

  function showNextPage(): void {
    fetch(posts.next_page).then(async response => {
      const nextPagePosts = (await response.json()) as PostPagination;
      if (response.ok) {
        nextPagePosts.results.unshift(...posts.results);
        setPosts(nextPagePosts);
      }
    });
  }

  return (
    <main className={commonStyles.container}>
      {posts.results.map(post => (
        <div className={styles.post} key={post.uid}>
          <Link key={post.uid} href={`/post/${post.uid}`}>
            <a>
              <strong>{post.data.title}</strong>
              <p>{post.data.subtitle}</p>
              <div className={styles.postInfo}>
                <div className={styles.infoItem}>
                  <img src="/images/calendar.svg" alt="calendar" />
                  <time>
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      {
                        locale: ptBR,
                      }
                    )}
                  </time>
                </div>
                <div className={styles.infoItem}>
                  <img src="/images/user.svg" alt="author" />
                  {post.data.author}
                </div>
              </div>
            </a>
          </Link>
        </div>
      ))}
      {posts.next_page != null && (
        <div className={styles.showMore}>
          <button type="button" onClick={showNextPage}>
            Carregar mais posts
          </button>
        </div>
      )}
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 1,
    }
  );

  return {
    props: {
      postsPagination: postsResponse,
    },
  };
};
