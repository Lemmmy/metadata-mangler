let kuroshiroInstance: Kuroshiro | null = null;

export async function initKuroshiro(): Promise<Kuroshiro> {
  if (kuroshiroInstance) return kuroshiroInstance;

  const kuroshiro = new ((Kuroshiro as any).default || Kuroshiro)();
  const analyzer = new KuromojiAnalyzer({
    dictPath: "/api/dict/",
  });

  await kuroshiro.init(analyzer);
  kuroshiroInstance = kuroshiro;
  return kuroshiro;
}
