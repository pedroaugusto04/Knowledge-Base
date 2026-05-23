import { useEffect, useState } from 'react';

const typeDelayMs = 84;
const deleteDelayMs = 44;
const holdDelayMs = 1150;

export function useTypewriterWord(words: readonly string[]) {
  const [wordIndex, setWordIndex] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (words.length === 0) return undefined;

    const currentWord = words[wordIndex] || '';
    const delay = isDeleting
      ? deleteDelayMs
      : characterCount === currentWord.length
        ? holdDelayMs
        : typeDelayMs;

    const timeout = window.setTimeout(() => {
      if (!isDeleting && characterCount < currentWord.length) {
        setCharacterCount((count) => count + 1);
        return;
      }

      if (!isDeleting) {
        setIsDeleting(true);
        return;
      }

      if (characterCount > 0) {
        setCharacterCount((count) => count - 1);
        return;
      }

      setIsDeleting(false);
      setWordIndex((index) => (index + 1) % words.length);
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [characterCount, isDeleting, wordIndex, words]);

  return {
    typed: (words[wordIndex] || '').slice(0, characterCount),
    full: words[wordIndex] || ''
  };
}
