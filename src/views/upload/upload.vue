<template>
  <div class="attendance-processor">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <h2>考勤表处理系统</h2>
        </div>
      </template>

      <el-upload class="upload-demo" drag :auto-upload="false" accept=".xlsx,.xls" :on-change="handleFileChange" :limit="1">
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text"> 将文件拖到此处或 <em>点击上传</em> </div>
        <template #tip>
          <div class="el-upload__tip"> 请上传Excel格式的考勤表 </div>
        </template>
      </el-upload>

      <el-button type="primary" :disabled="!selectedFile" @click="processExcel" class="mt-4"> 处理文件 </el-button>

      <el-result v-if="processSuccess" icon="success" title="处理成功" sub-title="新的考勤统计表已生成" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import * as XLSX from 'xlsx';
import type { UploadFile } from 'element-plus';

const selectedFile = ref<UploadFile | null>(null);
const processSuccess = ref(false);

// 处理文件选择
const handleFileChange = (uploadFile: UploadFile) => {
  selectedFile.value = uploadFile;
  processSuccess.value = false;
};

// 处理Excel文件
const processExcel = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择文件');
    return;
  }

  try {
    const file = selectedFile.value.raw as File;
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[1]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    console.log('jsonData', jsonData);
    // 处理数据
    const processedData = jsonData.map((row: any) => {
      const checkIn = new Date(row.上班时间);
      const checkOut = new Date(row.下班时间);
      const workingHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      console.log('row',row)
      return {
        姓名: row.姓名,
        日期: row.日期,
        上班时间: row.上班时间,
        下班时间: row.下班时间,
        工作时长: workingHours.toFixed(2) + '小时',
      };
    });

    // 生成新的Excel文件
    const newWorkbook = XLSX.utils.book_new();
    const newWorksheet = XLSX.utils.json_to_sheet(processedData);
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, '考勤统计');

    // 下载文件
    XLSX.writeFile(newWorkbook, '考勤统计表.xlsx');

    processSuccess.value = true;
    ElMessage.success('处理成功！');
  } catch (error) {
    console.error(error);
    ElMessage.error('处理文件时出错，请确保文件格式正确');
  }
};
</script>

<style scoped>
.attendance-processor {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mt-4 {
  margin-top: 16px;
}
</style>
