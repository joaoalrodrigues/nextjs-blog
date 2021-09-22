import { GetStaticProps } from 'next';
import Link from 'next/link';
import Head from 'next/head';

import Prismic from '@prismicio/client';
import { useEffect, useState } from 'react';
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
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string | false>(
    postsPagination.next_page
  );

  function showNextPage(): void {
    fetch(nextPage as any)
      .then(response => response.json())
      .then(data => {
        const newPosts = data.results.map((post: Post) => {
          return {
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };
        });
        setPosts([...posts, ...newPosts]);
        if (!data.next_page) {
          setNextPage(false);
        } else {
          setNextPage(data.next_page);
        }
      });
  }

  useEffect(() => {
    setPosts(postsPagination.results);
    setNextPage(postsPagination.next_page);
  }, [postsPagination.results]);

  return (
    <>
      <Head>
        <title>Home | spacetraveling.</title>
      </Head>
      <div className={commonStyles.container}>
        {posts.map(post => (
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
                    <span>{post.data.author}</span>
                  </div>
                </div>
              </a>
            </Link>
          </div>
        ))}
        <div className={styles.showMore}>
          {nextPage != null && (
            <button type="button" onClick={showNextPage}>
              Carregar mais posts
            </button>
          )}
        </div>
      </div>
    </>
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
      postsPagination: {
        next_page: postsResponse.next_page ? postsResponse.next_page : false,
        results: postsResponse.results,
      },
    },
    revalidate: 60 * 60, // 1 hora
  };
};
