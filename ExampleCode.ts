/**
 * Интерфейс узла Trie.
 * Каждый узел может иметь неограниченное количество дочерних узлов (ключ - символ, значение - узел).
 * @property {boolean} isEndOfWord - Флаг, указывающий, что узел является концом валидного слова.
 */
interface TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
}

/**
 * Класс реализации Trie (Префиксного дерева).
 * Поддерживает вставку, поиск, удаление и автодополнение.
 * Оптимизирован по памяти (использует Map) и по времени для строковой обработки.
 */
class Trie {
  private root: TrieNode;

  constructor() {
    this.root = this.createNode();
  }

  /**
   * Фабричный метод для создания нового пустого узла.
   * @private
   * @returns {TrieNode} Новый узел
   */
  private createNode(): TrieNode {
    return {
      children: new Map<string, TrieNode>(),
      isEndOfWord: false,
    };
  }

  /**
   * Вставляет слово в Trie. Итеративная реализация для производительности.
   * @param {string} word - Слово для вставки.
   */
  public insert(word: string): void {
    let currentNode = this.root;
    // Нормализуем слово к нижнему регистру для case-insensitive поиска
    const normalizedWord = word.toLowerCase();

    for (const char of normalizedWord) {
      // Находим или создаем дочерний узел для текущего символа
      let nextNode = currentNode.children.get(char);
      if (!nextNode) {
        nextNode = this.createNode();
        currentNode.children.set(char, nextNode);
      }
      currentNode = nextNode;
    }
    // Помечаем последний узел как конец слова
    currentNode.isEndOfWord = true;
  }

  /**
   * Ищет точное совпадение слова в Trie.
   * @param {string} word - Слово для поиска.
   * @returns {boolean} True, если слово найдено и оно является концом слова.
   */
  public search(word: string): boolean {
    const node = this.traverse(word);
    return node !== null && node.isEndOfWord;
  }

  /**
   * Проверяет, существует ли какой-либо путь с данным префиксом в Trie.
   * @param {string} prefix - Префикс для поиска.
   * @returns {boolean} True, если префикс существует.
   */
  public startsWith(prefix: string): boolean {
    return this.traverse(prefix) !== null;
  }

  /**
   * Вспомогательный метод для обхода дерева по строке.
   * Возвращает узел, на котором заканчивается обход по строке.
   * @private
   * @param {string} str - Строка для обхода.
   * @returns {TrieNode | null} Найденный узел или null.
   */
  private traverse(str: string): TrieNode | null {
    let currentNode = this.root;
    const normalizedStr = str.toLowerCase();

    for (const char of normalizedStr) {
      const nextNode = currentNode.children.get(char);
      if (!nextNode) {
        return null;
      }
      currentNode = nextNode;
    }
    return currentNode;
  }

  /**
   * Удаляет слово из Trie. Использует рекурсивный DFS для очистки неиспользуемых узлов.
   * @param {string} word - Слово для удаления.
   * @returns {boolean} True, если слово было успешно удалено.
   */
  public delete(word: string): boolean {
    const normalizedWord = word.toLowerCase();
    const canDelete = (node: TrieNode, depth: number = 0): boolean => {
      // Базовый случай: дошли до конца слова
      if (depth === normalizedWord.length) {
        // Если узел не является концом слова, значит, слова и не было -> нечего удалять.
        if (!node.isEndOfWord) {
          return false;
        }
        // Снимаем метку конца слова
        node.isEndOfWord = false;
        // Узел можно физически удалить, только если у него нет дочерних элементов
        return node.children.size === 0;
      }

      const char = normalizedWord[depth];
      const nextNode = node.children.get(char);

      // Если следующего узла нет, значит, слова нет в дереве -> нечего удалять.
      if (!nextNode) {
        return false;
      }

      // Рекурсивно спускаемся и проверяем, можно ли удалить дочерний узел
      const shouldDeleteChild = canDelete(nextNode, depth + 1);

      // Если дочерний узел помечен на удаление, удаляем его из Map
      if (shouldDeleteChild) {
        node.children.delete(char);
        // Текущий узел можно удалить, только если он больше не является концом другого слова
        // и у него не осталось других дочерних элементов.
        return node.children.size === 0 && !node.isEndOfWord;
      }
      // Если дочерний узел удалять не нужно, значит и текущий узел удалять нельзя.
      return false;
    };

    // Запускаем рекурсию с корневого узла
    return canDelete(this.root);
  }

  /**
   * Возвращает все слова в Trie, которые начинаются с заданного префикса (автодополнение).
   * Использует DFS для сбора слов.
   * @param {string} prefix - Префикс для автодополнения.
   * @returns {string[]} Массив слов, начинающихся с префикса.
   */
  public autocomplete(prefix: string): string[] {
    const results: string[] = [];
    const startNode = this.traverse(prefix);

    if (startNode === null) {
      return results;
    }

    /**
     * Вспомогательная рекурсивная функция для обхода поддерева.
     * @param {TrieNode} node - Текущий узел.
     * @param {string} currentWord - Текущее набранное слово.
     */
    const dfs = (node: TrieNode, currentWord: string) => {
      if (node.isEndOfWord) {
        results.push(currentWord);
      }
      // Итерируемся по всем дочерним узлам
      for (const [char, childNode] of node.children) {
        dfs(childNode, currentWord + char);
      }
    };

    // Начинаем DFS с узла, найденного по префиксу
    dfs(startNode, prefix.toLowerCase());
    return results;
  }

  /**
   * Опционально: Возвращает общее количество слов в Trie.
   * Может быть полезно для тестирования и отладки.
   * @returns {number} Количество слов.
   */
  public countWords(): number {
    let count = 0;
    // Используем обход в ширину (BFS), но DFS тоже подойдет
    const queue: TrieNode[] = [this.root];

    while (queue.length > 0) {
      const currentNode = queue.shift()!;
      if (currentNode.isEndOfWord) {
        count++;
      }
      for (const child of currentNode.children.values()) {
        queue.push(child);
      }
    }
    return count;
  }
}

// ==============================
// Пример использования и демонстрация
// ==============================

// 1. Создаем экземпляр Trie
const dictionary = new Trie();

// 2. Вставляем слова (можно из файла, базы данных и т.д.)
const wordsToInsert = [
  'apple',
  'application',
  'banana',
  'band',
  'bandwidth',
  'java',
  'javascript',
  'type',
  'typescript',
  'react',
];
wordsToInsert.forEach((word) => dictionary.insert(word));

// 3. Демонстрация функциональности
console.log('Search "apple":', dictionary.search('apple')); // true
console.log('Search "app":', dictionary.search('app')); // false
console.log('StartsWith "app":', dictionary.startsWith('app')); // true

console.log('Autocomplete for "ban":', dictionary.autocomplete('ban'));
// ['banana', 'band', 'bandwidth']

console.log('Autocomplete for "type":', dictionary.autocomplete('type'));
// ['type', 'typescript']

// 4. Демонстрация удаления
console.log('Deleting "band"...');
dictionary.delete('band');
console.log('Search "band":', dictionary.search('band')); // false
console.log('Search "bandwidth":', dictionary.search('bandwidth')); // true (осталось)
console.log('Autocomplete for "ban":', dictionary.autocomplete('ban'));
// ['banana', 'bandwidth'] ("band" удалено)

console.log('Total word count:', dictionary.countWords()); // 9
