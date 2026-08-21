import avlRotation from "@/assets/avl-rotation.jpg";
import complexityCurves from "@/assets/complexity-curves.jpg";
import memoryPaging from "@/assets/memory-paging.jpg";

export type Depth = "conceptual" | "technical" | "deep";

export type QuizOption = {
  id: string;
  label: string;
  correct: boolean;
  rationale: string;
};

export type Lesson = {
  id: string;
  topicId: string;
  module: string;
  title: string;
  minutes: number;
  image: string;
  imageAlt: string;
  figure: string;
  body: Record<Depth, string[]>;
  quiz: {
    prompt: string;
    options: QuizOption[];
  };
};

export type Topic = {
  id: string;
  name: string;
};

export const topics: Topic[] = [
  { id: "ds", name: "Data Structures" },
  { id: "algo", name: "Algorithm Design" },
  { id: "os", name: "Operating Systems" },
];

export const lessons: Lesson[] = [
  {
    id: "avl",
    topicId: "ds",
    module: "MODULE 4.2",
    title: "Self-Balancing Trees: The AVL Approach",
    minutes: 12,
    image: avlRotation,
    imageAlt: "Diagram of an AVL tree rotation restoring balance",
    figure: "Fig 4.1: Left-Right rotation applied to an unbalanced node.",
    body: {
      conceptual: [
        "The core problem with standard Binary Search Trees is their tendency to become unbalanced. If keys arrive in sorted order, the tree degenerates into a linked list and search costs O(n) instead of O(log n).",
        "An AVL tree fixes this by never letting any node's two subtrees differ in height by more than one. Whenever an insertion breaks that promise, the tree rotates itself back into shape.",
      ],
      technical: [
        "Every node stores a balance factor: height(left) − height(right). Valid values are −1, 0 and +1. Insertion walks back up the path to the root, updating heights and checking factors.",
        "A factor of +2 with the new key in the outer subtree needs a single right rotation; if the key landed in the inner subtree you need a left-right double rotation. The mirrored cases apply for −2.",
        "Each rotation is O(1) pointer surgery, and at most one rebalance is needed per insertion, so insertion stays O(log n).",
      ],
      deep: [
        "Rotations preserve the in-order traversal, which is exactly why they are safe: they permute structure, not ordering. Proving this is the standard first exercise in verified-data-structure courses.",
        "The worst-case height of an AVL tree with n nodes is ~1.44·log2(n+2), derived from the Fibonacci-shaped minimal AVL trees. Red-black trees allow ~2·log2(n) — looser balance, cheaper writes.",
        "Deletion is the harder case: unlike insertion, a single delete can cascade rotations all the way to the root, giving O(log n) rotations rather than O(1).",
      ],
    },
    quiz: {
      prompt:
        "A node has left-subtree height 4 and right-subtree height 2, and the new key was inserted into the inner subtree of the heavy side. Which fix is required?",
      options: [
        {
          id: "a",
          label: "A. Single left-left rotation",
          correct: false,
          rationale:
            "A single rotation only works when the insertion goes into the outer subtree of the heavy side.",
        },
        {
          id: "b",
          label: "B. Double rotation (LR or RL)",
          correct: true,
          rationale:
            "Balance factor |2| with an inner-subtree insertion needs the middle node aligned first, then the main rotation.",
        },
        {
          id: "c",
          label: "C. No rotation needed",
          correct: false,
          rationale: "A balance factor of 2 already violates the AVL invariant, so a fix is mandatory.",
        },
      ],
    },
  },
  {
    id: "amortized",
    topicId: "algo",
    module: "MODULE 2.5",
    title: "Amortized Analysis and Growth Intuition",
    minutes: 10,
    image: complexityCurves,
    imageAlt: "Plot comparing constant, logarithmic, linear and quadratic growth curves",
    figure: "Fig 2.3: Cost curves compared over increasing input size.",
    body: {
      conceptual: [
        "Some operations are usually cheap and occasionally expensive. Appending to a dynamic array is O(1) — except when the array is full and everything must be copied.",
        "Amortized analysis asks the fair question: across a long run of operations, what does one operation cost on average? For dynamic arrays the answer is still O(1).",
      ],
      technical: [
        "Use the accounting method: charge each append 3 units — one for the write, two saved for the future copy. When a resize doubles capacity, the saved credits exactly pay for moving the old elements.",
        "Doubling is essential. Growing by a fixed constant makes the total copy work quadratic, turning each append into O(n) amortized.",
        "Amortized is not average-case: it makes no assumption about the input distribution, only about the sequence of operations.",
      ],
      deep: [
        "The potential method generalizes this: define Φ(state) ≥ 0, and amortized cost = actual cost + ΔΦ. For a dynamic array, Φ = 2·size − capacity works cleanly.",
        "Union-Find with path compression and union by rank gives an amortized O(α(n)) per operation, where α is the inverse Ackermann function — effectively constant for any realistic n.",
        "Beware amortization in latency-sensitive systems: an O(1) amortized append still produces a single multi-millisecond pause when a huge array resizes.",
      ],
    },
    quiz: {
      prompt:
        "A dynamic array grows by a fixed +10 slots instead of doubling. What is the amortized cost of one append over n appends?",
      options: [
        {
          id: "a",
          label: "A. O(1) — still constant",
          correct: false,
          rationale: "Constant amortized cost depends on geometric growth, not additive growth.",
        },
        {
          id: "b",
          label: "B. O(n) — linear",
          correct: true,
          rationale:
            "Fixed-size growth triggers n/10 resizes, each copying up to n elements: total O(n²), so O(n) per append.",
        },
        {
          id: "c",
          label: "C. O(log n)",
          correct: false,
          rationale: "log n shows up with doubling-count arguments, not with additive resizing.",
        },
      ],
    },
  },
  {
    id: "paging",
    topicId: "os",
    module: "MODULE 6.1",
    title: "Memory Paging and Segmentation",
    minutes: 14,
    image: memoryPaging,
    imageAlt: "Diagram mapping virtual pages to physical frames through a page table",
    figure: "Fig 6.1: Virtual page to physical frame translation.",
    body: {
      conceptual: [
        "Every process believes it owns a clean, contiguous address space. Paging is the illusion machine: the OS chops that space into fixed-size pages and scatters them across physical frames.",
        "Because pages are fixed size, memory can never fragment externally — only the last page of an allocation is partly wasted.",
      ],
      technical: [
        "A virtual address splits into a page number and an offset. The MMU looks up the page number in the page table to get a frame number, then concatenates the untouched offset.",
        "Page tables are large, so real systems use multi-level tables and cache recent translations in the TLB. A TLB hit costs a cycle; a miss costs a walk; a page fault costs a disk round trip.",
        "Segmentation instead splits memory by logical unit — code, stack, heap — with variable sizes, which is why it reintroduces external fragmentation.",
      ],
      deep: [
        "x86-64 uses a four-level radix page table (PML4 → PDPT → PD → PT), so an uncached translation is four memory reads before the actual access.",
        "Huge pages (2 MB / 1 GB) cut TLB pressure dramatically for large working sets, at the cost of coarser memory accounting and more internal fragmentation.",
        "Modern kernels combine both models: flat paging for translation plus segment-like protection bits and per-region policies enforced in the page-table entries.",
      ],
    },
    quiz: {
      prompt: "With 4 KB pages, which part of a virtual address is passed through translation unchanged?",
      options: [
        {
          id: "a",
          label: "A. The high-order page number",
          correct: false,
          rationale: "The page number is exactly the part replaced by a frame number.",
        },
        {
          id: "b",
          label: "B. The low-order 12-bit offset",
          correct: true,
          rationale: "4 KB = 2¹², so the bottom 12 bits index inside the page and are copied verbatim.",
        },
        {
          id: "c",
          label: "C. Neither — the whole address is remapped",
          correct: false,
          rationale: "Only the page-number portion is remapped; the offset survives translation.",
        },
      ],
    },
  },
];

export const lessonsByTopic = (topicId: string) => lessons.filter((l) => l.topicId === topicId);

export const getLesson = (id: string) => lessons.find((l) => l.id === id) ?? lessons[0];

export const depthForMastery = (mastery: number): Depth =>
  mastery < 35 ? "conceptual" : mastery < 70 ? "technical" : "deep";

export const depthLabels: { id: Depth; label: string }[] = [
  { id: "conceptual", label: "Conceptual" },
  { id: "technical", label: "Technical" },
  { id: "deep", label: "Deep dive" },
];
