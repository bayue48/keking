const NOVELPIA_API_BASE_URL = "https://api-global.novelpia.com/v1";
const NOVELPIA_BASE_URL = "https://global.novelpia.com";

function normalizeUrl(value: string): string {
  if (value.startsWith("//")) {
    return `https:${value}`;
  }
  
  return value;
}

function getAuthorName(
  writerList: Array<{
    flag_type: number;
    writer_name: string;
  }>,
): string {
  const primaryWriter = writerList.find((writer) => writer.flag_type === 0);

  if (primaryWriter?.writer_name) {
    return primaryWriter.writer_name;
  }

  return writerList[0]?.writer_name ?? "Unknown";
}

type NovelPiaSearchResponse = {
  code: string;
  errmsg: string;
  result?: {
    list?: NovelPiaSearchItem[];
  };
};

type NovelPiaSearchItem = {
  novel: {
    novel_no: number;
    novel_name: string;
    novel_story: string;
    novel_img: string;
    count_view: number;
    count_like: number;
    count_epi: number;
    flag_adult: number;
    flag_complete: number;
    novel_locale: string;
    new_epi_open_dt: string;
  };
  tag_list: Array<{
    tag_name: string;
  }>;
  writer_list: Array<{
    flag_type: number;
    writer_name: string;
  }>;
};

export type PiaNovel = {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  views: number;
  likes: number;
  episodes: number;
  isAdult: boolean;
  isComplete: boolean;
  locale: string;
  author: string;
  updatedAt: string;
  tags: string[];
  url: string;
};

export async function searchNovels(query: string, page = 1): Promise<PiaNovel[]> {
  const params = new URLSearchParams({
    page: page.toString(),
    search_type: "all",
    search_val: query,
    search_val_input: query,
    sort_col: "new_epi_open_dt",
    sort: "desc",
    rows: "30",
  });

  const response = await fetch(`${NOVELPIA_API_BASE_URL}/novel/search?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`NovelPia request failed with status ${response.status}`);
  }

  const data = (await response.json()) as NovelPiaSearchResponse;

  if (data.code !== "0000") {
    throw new Error(data.errmsg || `NovelPia returned error code ${data.code}`);
  }

  return (data.result?.list ?? []).map((item) => ({
    id: item.novel.novel_no,
    title: item.novel.novel_name,
    description: item.novel.novel_story,
    imageUrl: normalizeUrl(item.novel.novel_img),
    views: item.novel.count_view,
    likes: item.novel.count_like,
    episodes: item.novel.count_epi,
    isAdult: item.novel.flag_adult === 1,
    isComplete: item.novel.flag_complete === 1,
    locale: item.novel.novel_locale,
    author: getAuthorName(item.writer_list),
    updatedAt: item.novel.new_epi_open_dt,
    tags: item.tag_list.map((tag) => tag.tag_name),
    url: `${NOVELPIA_BASE_URL}/novel/${item.novel.novel_no}`,
  }));
}
