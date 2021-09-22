import { GetStaticPaths, GetStaticProps } from 'next';

import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

function getReadingAverageTime(post: Post): number {
  const headingWords = post.data.content.map(section => section.heading);
  const bodyWords = post.data.content.map(section =>
    RichText.asText(section.body)
  );
  const allWords = [...headingWords, ...bodyWords];

  const numberOfWords = allWords.reduce(
    (wordCounter, currentText) =>
      wordCounter + currentText.split(/\s+\b/).length,
    0
  );

  const readingTime = Math.ceil(numberOfWords / 200);

  return readingTime;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div className={commonStyles.container}>Carregando...</div>;
  }

  const readingTime = getReadingAverageTime(post);

  return (
    <>
      <div className={styles.bannerContainer}>
        <img src={post.data.banner.url} alt="banner" />
      </div>
      <div className={commonStyles.container}>
        <div className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={styles.postInfo}>
            <div>
              <img src="/images/calendar.svg" alt="calendar" />
              <time>
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </time>
            </div>
            <div>
              <img src="/images/user.svg" alt="author" />
              {post.data.author}
            </div>
            <div>
              <img src="/images/clock.svg" alt="time" />
              {readingTime} min
            </div>
          </div>
          {post.data.content.map(section => (
            <div className={styles.postBody} key={Math.random()}>
              <h2>{section.heading}</h2>
              <p
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(section.body.map(item => item)),
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      orderings: '[post.first_publication_date]',
      pageSize: 1,
    }
  );

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const post = await prismic.getByUID('post', String(params.slug), {});

  return {
    props: {
      post,
    },
    revalidate: 60 * 60 * 24, // 24 horas
  };
};
