/**
 * CategoryTaxonomy —— 基于 OFF 官方 categories.json 的真实父子分类关系图。
 *
 * 这是个 DAG(有向无环图),不是树:一个分类可能同时有多个 parents
 * (比如 en:fresh-taro-tubers 同时挂在 en:fresh-vegetables 和 en:taro-tubers 下)。
 * 所以"往上找祖先"要用 BFS 顺着所有 parent 分支一起爬,不能假设只有一条路径。
 *
 * Port 自 Python 版 category_taxonomy.py，逻辑完全一致。
 */

export class CategoryTaxonomy {
  private parents: Map<string, string[]>;
  private ancestorsCache: Map<string, Set<string>> = new Map();

  /**
   * @param parentsMap 形如 { "en:sliced-breads": ["en:breads"], ... } 的对象，
   *   即 categories_parents.json 读出来的内容（fetch_categories_taxonomy.py 生成的）。
   */
  constructor(parentsMap: Record<string, string[]>) {
    this.parents = new Map(Object.entries(parentsMap));
  }

  /** BFS 往上爬，找出这个分类所有的祖先(不含自己)。带 visited 防止 DAG 里的环。带缓存。 */
  getAllAncestors(cat: string): Set<string> {
    const cached = this.ancestorsCache.get(cat);
    if (cached) return cached;

    const visited = new Set<string>();
    const queue: string[] = [cat];
    while (queue.length > 0) {
      const c = queue.shift()!;
      for (const p of this.parents.get(c) ?? []) {
        if (!visited.has(p)) {
          visited.add(p);
          queue.push(p);
        }
      }
    }
    this.ancestorsCache.set(cat, visited);
    return visited;
  }

  /**
   * 在一个产品自己的 categoriesTags 里，挑出真正的"叶子"分类——
   * 即不是列表里其他分类的祖先的那些。
   * (OFF 通常已经把某个具体分类的所有祖先都展开放进了 categories_tags，
   *  所以正常情况下只会剩 1~2 个叶子，除非产品同时属于好几个分支。)
   */
  mostSpecificTags(categoriesTags: string[]): string[] {
    const tagSet = new Set(categoriesTags);
    const leaves: string[] = [];
    for (const cat of categoriesTags) {
      let isAncestorOfAnother = false;
      for (const other of tagSet) {
        if (other !== cat && this.getAllAncestors(other).has(cat)) {
          isAncestorOfAnother = true;
          break;
        }
      }
      if (!isAncestorOfAnother) leaves.push(cat);
    }
    return leaves;
  }

  /**
   * 从 startCat 开始(含自己)按 BFS 逐层往上爬 parents，
   * 返回第一个满足 isValid(cat) 的祖先。DAG 有多个 parent 分支时，
   * BFS 保证是按"跳数"由近到远搜，不会因为先走了某一条长路径而漏掉近的。
   * 找不到就返回 null。
   */
  nearestAncestorWithData(
    startCat: string,
    isValid: (cat: string) => boolean,
    maxHops = 50
  ): string | null {
    const visited = new Set<string>([startCat]);
    let queue: string[] = [startCat];
    let hops = 0;
    while (queue.length > 0 && hops <= maxHops) {
      const nextQueue: string[] = [];
      for (const cat of queue) {
        if (isValid(cat)) return cat;
        for (const parent of this.parents.get(cat) ?? []) {
          if (!visited.has(parent)) {
            visited.add(parent);
            nextQueue.push(parent);
          }
        }
      }
      queue = nextQueue;
      hops += 1;
    }
    return null;
  }
}
