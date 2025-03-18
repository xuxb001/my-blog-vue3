<template>
  <div class="upload-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>考勤数据导入</span>
        </div>
      </template>
      <el-date-picker
        v-model="monthValue"
        type="month"
        placeholder="Pick a month"
        value-format="YYYY-MM"
      />
      <div class="content">
        <!-- 上传区域 -->
        <el-upload class="upload-demo" drag :auto-upload="false" accept=".xlsx,.xls" :on-change="handleFileChange" :limit="1">
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text"> 将考勤Excel文件拖到此处或 <em>点击上传</em> </div>
          <template #tip>
            <div class="el-upload__tip"> 支持.xlsx或.xls格式的考勤表格文件 </div>
          </template>
        </el-upload>

        <!-- 操作按钮 -->
        <div class="operation-area">
          <el-button type="primary" :disabled="!selectedFile" @click="processExcel" :loading="processing"> 处理文件 </el-button>
        </div>

        <!-- 预览区域 -->
        <div v-if="previewData.length" class="preview-area">
          <h3>数据预览</h3>
          <el-table :data="previewData" border style="width: 100%" height="400">
            <el-table-column prop="姓名" label="姓名" />
            <el-table-column prop="考勤组" label="考勤组" />
            <el-table-column prop="部门" label="部门" />
            <el-table-column prop="工号" label="工号" />
            <el-table-column prop="考勤日期" label="考勤日期" />
            <el-table-column prop="考勤时间" label="考勤时间" />
            <el-table-column prop="打卡时间" label="打卡时间" />
          </el-table>
        </div>

        <!-- 处理结果提示 -->
        <el-result v-if="processSuccess" icon="success" title="处理成功" sub-title="新的考勤统计表已生成" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage,  } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import * as XLSX from 'xlsx';
import type { UploadFile } from 'element-plus';

const selectedFile = ref<UploadFile | null>(null);
const processing = ref(false);
const processSuccess = ref(false);
const previewData = ref<any[]>([]);
const monthValue = ref('')

// 处理文件选择
const handleFileChange = async (uploadFile: UploadFile) => {
  selectedFile.value = uploadFile;
  processSuccess.value = false;

  // 预览数据
  try {
    const file = uploadFile.raw as File;
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[1]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    console.log('jsonData', jsonData);

    // previewData.value = processedJsonData.slice(5, 10); // 显示前10条记录(5个人的上下班记录)

    // previewData.value = jsonData.slice(0, 5); // 只显示前5行预览
  } catch (error) {
    ElMessage.error('文件预览失败，请检查文件格式');
  }
};

// 处理Excel文件
const processExcel = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择文件');
    return;
  }
  if (!monthValue.value) {
    ElMessage.warning('请先选择考勤月份');
    return;
  }
  processing.value = true;
  try {
    const file = selectedFile.value.raw as File;
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[1]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // 处理数据：按人员和日期分组统计
    const processedData = processAttendanceData(jsonData);
    console.log('processedData', processedData);

    // 生成新的Excel文件
    const newWorkbook = XLSX.utils.book_new();
    const newWorksheet = XLSX.utils.json_to_sheet(processedData);

    // 创建居中样式对象
    const centerStyle = {
      alignment: {
        horizontal: 'center',
        vertical: 'center'
      },
      font: {
        color: { rgb: "FF0000" }, // 红色字体
        // 或使用索引颜色（0-63）
        // theme: 1 // 浅红色
      }
    };
    // 遍历所有单元格应用样式
    const range = XLSX.utils.decode_range(newWorksheet['!ref']!);
    for(let R = range.s.r; R <= range.e.r; ++R) {
      for(let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = {c:C, r:R};
        const cell_ref = XLSX.utils.encode_cell(cell_address);

        if(!newWorksheet[cell_ref]) continue;

        // 保留原有单元格内容，添加样式
        newWorksheet[cell_ref].s = {
          ...newWorksheet[cell_ref].s,
          ...centerStyle,
          // 单独设置字体颜色（需要保留其他样式）
          font: {
            ...newWorksheet[cell_ref].s?.font,
            color: { rgb: "0000FF" } // 蓝色
          }
        };
      }
    }
    // 设置列宽
    newWorksheet['!cols'] = [
      { wch: 10 },
      { wch: 35 },
      { wch: 10 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 10 },
      { wch: 10 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, '原始记录');

    // 下载文件
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(newWorkbook, `考勤统计表_${date}.xlsx`);

    processSuccess.value = true;
    ElMessage.success('处理成功！');
  } catch (error) {
    console.error(error);
    ElMessage.error('处理文件时出错，请确保文件格式正确');
  } finally {
    processing.value = false;
  }
};

// 处理考勤数据
const processAttendanceData = (data: any[]) => {
  // 格式化时间
  const formatExcelTime = (excelTime: number) => {
    if (typeof excelTime === 'number') {
      const hours = Math.floor(excelTime * 24);
      const minutes = Math.floor((excelTime * 24 * 60) % 60);
      const seconds = Math.floor((excelTime * 24 * 60 * 60) % 60);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return '';
  };
  console.log('data', data);
  const firstKey = Object.keys(data[0])[0]
  const week = data[2];
  console.log('week', week);

  const dealData = data.slice(4);
  console.log(dealData, 'dealData');

  let allDate = {};
  for (const key in data[3]) {
    if (data[3].hasOwnProperty(key)) {
      const value = data[3][key]+'';
      allDate[key] = `${monthValue.value}-${value.length==1?'0'+value:value}`;
    }
  }

  // 创建日期和星期的映射
  const dateWeekMap = new Map();
  const dateMap = new Map();
  // 处理bb数据（日期映射）
  Object.entries(allDate).forEach(([key, value]) => {
    if (key.startsWith('__EMPTY_')) {
      const index = key.split('__EMPTY_')[1];
      dateMap.set(key, value);
    }
  });

  // 处理week数据（星期映射）
  Object.entries(week).forEach(([key, value]) => {
    if (key.startsWith('__EMPTY_')) {
      dateWeekMap.set(key, value);
    }
  });

  const processedData = [];

  dealData.forEach((record) => {
    const name = record[firstKey];
    const type = record['__EMPTY']; // 签到或签退

    // 遍历每一个打卡记录
    Object.entries(record).forEach(([key, value]) => {
      if (key.startsWith('__EMPTY_') && key !== '__EMPTY') {
        const date = dateMap.get(key);
        const week = dateWeekMap.get(key) || '';
        const formattedDate = date.slice(2)
        if (date) {
          const attendanceDate = `${formattedDate} ${week}`.trim();
          const checkTime = typeof value === 'number' ? formatExcelTime(value) : value;

          // 根据签到/签退类型设置考勤时间
          const attendanceTime = type === '签到' ? '08:30' : '18:00';

          processedData.push({
            姓名: name,
            部门: '省分事业部-华东业务线-上海业务中心',
            工号: 'D18626',
            职位: '高级测试工程师',
            考勤日期: attendanceDate,
            考勤时间: `${date} ${attendanceTime}`,
            打卡时间: checkTime,
            打卡结果: value === '年假' ? '年假' : '正常',
            打卡地址: '中国联通南方基地',
          });
        }
      }
    });
  });
  // 按照姓名和考勤时间排序
  processedData.sort((a, b) => {
    if (a.姓名 < b.姓名) {
      return -1;
    }
    if (a.姓名 > b.姓名) {
      return 1;
    }
    // 如果姓名相同，则按考勤时间排序
    const timeA = new Date(a.考勤时间).getTime();
    const timeB = new Date(b.考勤时间).getTime();
    return timeA - timeB;
  });
  return processedData;

};
</script>

<style scoped>
.upload-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content {
  min-height: 300px;
}

.operation-area {
  margin: 20px 0;
  text-align: center;
}

.preview-area {
  margin-top: 20px;
}

.preview-area h3 {
  margin-bottom: 15px;
}

:deep(.el-upload-dragger) {
  width: 100%;
  height: 200px;
}
</style>
