# quiz_builder

一個簡單的測驗建立工具。

## 測驗資料格式

測驗資料結構範例如下：

```json
[
  {
    "question": "日本語",
    "options": ["日文", "英文", "中文", "法文"],
    "answer": "日文",
    "ttsText": "にほんご"
  },
  {
    "question": "蘋果",
    "options": ["りんご", "みかん", "いちご", "ぶどう"],
    "answer": "りんご",
    "ttsText": "りんご"
  }
]
```

```json
[
  {
    "question": "下列哪一種排序演算法的平均時間複雜度為 O(n log n)？",
    "options": ["泡沫排序 (Bubble Sort)", "插入排序 (Insertion Sort)", "快速排序 (Quick Sort)", "選擇排序 (Selection Sort)"],
    "answer": "快速排序 (Quick Sort)",
    "explanation": "Quick Sort 的平均時間複雜度為 O(n log n)，而 Bubble Sort、Insertion Sort、Selection Sort 的平均時間複雜度皆為 O(n²)。"
  },
  {
    "question": "在 C 語言中，下列哪個關鍵字用來動態配置記憶體？",
    "options": ["alloc", "malloc", "new", "create"],
    "answer": "malloc",
    "explanation": "C 語言使用 malloc() 函式（定義於 <stdlib.h>）進行動態記憶體配置，使用完畢後須以 free() 釋放。"
  },
  {
    "question": "以下程式碼執行後，x 的值為何？\n\nint x = 5;\nx = x++ + ++x;",
    "options": ["11", "12", "13", "10"],
    "answer": "12",
    "explanation": "x++ 先取值 5 再遞增，++x 先遞增後取值 7，所以 x = 5 + 7 = 12。（注意：此類行為在 C 中屬未定義行為，此處以常見編譯器結果為準。）"
  },
  {
    "question": "Stack（堆疊）的存取原則是？",
    "options": ["FIFO（先進先出）", "LIFO（後進先出）", "隨機存取", "優先權存取"],
    "answer": "LIFO（後進先出）",
    "explanation": "Stack 採用 LIFO（Last In, First Out）原則，最後推入的元素最先被取出，如同疊盤子的概念。"
  },
  {
    "question": "下列哪一種資料結構最適合實作「廣度優先搜尋（BFS）」？",
    "options": ["Stack", "Queue", "Heap", "Linked List"],
    "answer": "Queue",
    "explanation": "BFS 需要按照層次順序依序處理節點，Queue 的 FIFO 特性正好符合此需求。"
  },
  {
    "question": "在物件導向程式設計中，「繼承（Inheritance）」的主要目的是？",
    "options": ["隱藏實作細節", "讓子類別重用父類別的屬性與方法", "讓多個物件共享同一個方法名稱", "限制物件的存取權限"],
    "answer": "讓子類別重用父類別的屬性與方法",
    "explanation": "繼承允許子類別繼承父類別的屬性與方法，達到程式碼重用的目的，並可透過覆寫（Override）擴充或修改行為。"
  },
  {
    "question": "下列哪一個 Big-O 複雜度成長速度最慢（效能最好）？",
    "options": ["O(n²)", "O(n log n)", "O(log n)", "O(n)"],
    "answer": "O(log n)",
    "explanation": "成長速度由慢到快排列：O(1) < O(log n) < O(n) < O(n log n) < O(n²)，O(log n) 在這幾個選項中成長最慢，效能最佳。"
  },
  {
    "question": "以下 Python 程式碼的輸出結果為何？\n\nprint([x**2 for x in range(4)])",
    "options": ["[1, 4, 9, 16]", "[0, 1, 4, 9]", "[0, 1, 2, 3]", "[1, 2, 3, 4]"],
    "answer": "[0, 1, 4, 9]",
    "explanation": "range(4) 產生 0, 1, 2, 3，各自平方後得到 0, 1, 4, 9，使用 list comprehension 組成串列。"
  },
  {
    "question": "下列關於 Linked List 與 Array 的敘述，何者正確？",
    "options": ["Linked List 支援 O(1) 隨機存取", "Array 在中間插入元素的時間複雜度為 O(1)", "Linked List 在已知節點位置時插入元素的時間複雜度為 O(1)", "Array 不支援動態調整大小"],
    "answer": "Linked List 在已知節點位置時插入元素的時間複雜度為 O(1)",
    "explanation": "Linked List 只需修改指標即可完成插入，為 O(1)；而 Array 隨機存取為 O(1)，但中間插入需搬移元素，為 O(n)。"
  },
  {
    "question": "在關聯式資料庫中，下列哪個 SQL 指令用來從資料表中刪除特定資料列？",
    "options": ["REMOVE", "DROP", "DELETE", "TRUNCATE"],
    "answer": "DELETE",
    "explanation": "DELETE 用於刪除符合條件的特定資料列，可搭配 WHERE 子句使用。DROP 用於刪除整個資料表，TRUNCATE 用於清空整張表但保留結構。"
  }
]
```
