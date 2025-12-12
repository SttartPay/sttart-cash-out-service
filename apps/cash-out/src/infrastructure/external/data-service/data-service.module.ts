import { Module } from '@nestjs/common';
import { AxiosHttpModule } from '../axios-http.module';
import { InternalTransferDataService } from './internal-transfer.service';
import { InternalTransferDataServicePortToken } from '../../../core/ports/internal-transfer-data-service.port';

@Module({
    imports: [AxiosHttpModule],
    providers: [
        InternalTransferDataService,
        {
            provide: InternalTransferDataServicePortToken,
            useExisting: InternalTransferDataService,
        },
    ],
    exports: [InternalTransferDataServicePortToken],
})
export class DataServiceModule { }
