import { Module } from "@nestjs/common";
import { AxiosHttp } from "./axios-http.service";

@Module({
  providers: [AxiosHttp],
  exports: [AxiosHttp],
})
export class AxiosHttpModule {}
