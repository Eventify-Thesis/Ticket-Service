"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSeatDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_seat_dto_1 = require("./create-seat.dto");
class UpdateSeatDto extends (0, swagger_1.PartialType)(create_seat_dto_1.CreateSeatDto) {
}
exports.UpdateSeatDto = UpdateSeatDto;
//# sourceMappingURL=update-seat.dto.js.map