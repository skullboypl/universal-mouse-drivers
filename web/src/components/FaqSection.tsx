'use client'

import styles from './FaqSection.module.css'

export type FaqEntry = { question: string; answer: string }

export function FaqSection({
  title,
  items,
  id = 'faq',
}: {
  title: string
  items: FaqEntry[]
  id?: string
}) {
  return (
    <section className={styles.section} id={id} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className={styles.title}>
        {title}
      </h2>
      <div className={styles.list}>
        {items.map((item) => (
          <details key={item.question} className={styles.item}>
            <summary className={styles.summary}>{item.question}</summary>
            <p className={styles.answer}>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
