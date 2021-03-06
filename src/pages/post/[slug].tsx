import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';

import { FiUser, FiCalendar, FiClock } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';

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

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  const formattedContent = post.data.content.map(contentItem => {
    return {
      heading: contentItem.heading,
      body: contentItem.body.map(text => ({ text })),
    };
  });

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  return (
    <>
      <Header />
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>
      <img src={post.data.banner.url} className={styles.banner} alt="banner" />

      <main className={commonStyles.container}>
        <div className={styles.descriptions}>
          <h1>{post.data.title}</h1>
          <div className={commonStyles.containerIcons}>
            <span>
              <FiCalendar />
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </span>
            <span>
              <FiUser />
              {post.data.author}
            </span>
            <span>
              <FiClock />
              {formattedContent.reduce((acc, item) => {
                const headingWords = item.heading?.split(' ');
                const bodyWords = item.body.reduce((bodyAcc, bodyItem) => {
                  const formattedText = bodyItem.text.text.split(' ');
                  const arrayOfWords = formattedText;
                  return [...bodyAcc, ...arrayOfWords];
                }, []);

                const allWords = [...headingWords, ...bodyWords];
                const calc = Math.ceil(allWords.length / 200);
                return acc + calc;
              }, 0)}{' '}
              min
            </span>
          </div>
        </div>

        {formattedContent.map(item => {
          const itemsFromBody = item.body
            .reduce(
              (acc, bodyItem) => {
                const html = RichText.asHtml([bodyItem.text]);
                return [...acc, html];
              },
              [`<strong>${item.heading}</strong>`]
            )
            .join('');

          return (
            <article
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: `${itemsFromBody}`,
              }}
              key={Math.random()}
              className={styles.content}
            />
          );
        })}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title'],
      pageSize: 2,
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
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
    },
  };
};
