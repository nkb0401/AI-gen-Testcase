export const TESTCASE_KEYWORDS = [
    "gen testcase", "gen test case",
    "generate testcase", "generate test case",
    "create testcase", "create test case",
    "tạo testcase", "tạo test case",
    "viết testcase", "viết test case"
  ];
 
  export const TESTCASE_PROMPT_SUFFIX = `.Tạo bộ testcases như yêu cầu.
  - Trả về duy nhất chuỗi JSON theo định dạng mảng.
  - Mỗi phần tử là 1 test case, có model như sau:
  {
    "TestCaseID":"Mã hoặc số định danh duy nhất cho mỗi test case",
    "Description":"Một mô tả chi tiết hơn về test case",
    "Title": "mô tả ngắn gọn test case",
    "DataTest": { ... dữ liệu đầu vào ... },
    "PreConditions": "điều kiện để thực hiện test case",
    "Steps": [ ... danh sách các bước thực hiện ... ],
    "Expected": "Mô tả kết quả mong muốn"
  }
  và Không cần giải thích, mô tả, hoặc chú thích gì thêm — chỉ trả về JSON`;