let kuroshiroInstance: Kuroshiro | null = null;

export async function initKuroshiro(): Promise<Kuroshiro> {
  if (kuroshiroInstance) return kuroshiroInstance;

  const kuroshiro = new ((Kuroshiro as any).default || Kuroshiro)();
  const analyzer = new KuromojiAnalyzer({
    dictPath: "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/",
  });

  await kuroshiro.init(analyzer);
  kuroshiroInstance = kuroshiro;
  return kuroshiro;
}
