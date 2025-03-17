"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketSchema = exports.Ticket = exports.TicketType = exports.TicketStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const swagger_1 = require("@nestjs/swagger");
var TicketStatus;
(function (TicketStatus) {
    TicketStatus["AVAILABLE"] = "available";
    TicketStatus["RESERVED"] = "reserved";
    TicketStatus["SOLD"] = "sold";
    TicketStatus["CANCELLED"] = "cancelled";
})(TicketStatus || (exports.TicketStatus = TicketStatus = {}));
var TicketType;
(function (TicketType) {
    TicketType["STANDARD"] = "standard";
    TicketType["VIP"] = "vip";
    TicketType["EARLY_BIRD"] = "early_bird";
})(TicketType || (exports.TicketType = TicketType = {}));
let Ticket = class Ticket {
};
exports.Ticket = Ticket;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Event ID this ticket belongs to" }),
    (0, mongoose_1.Prop)({
        type: String,
        required: true,
        index: true,
    }),
    __metadata("design:type", String)
], Ticket.prototype, "eventId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Showing/Session ID this ticket belongs to" }),
    (0, mongoose_1.Prop)({
        type: String,
        required: true,
        index: true,
    }),
    __metadata("design:type", String)
], Ticket.prototype, "showingId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: TicketStatus,
        description: "Current status of the ticket",
    }),
    (0, mongoose_1.Prop)({
        type: String,
        enum: TicketStatus,
        default: TicketStatus.AVAILABLE,
        index: true,
    }),
    __metadata("design:type", String)
], Ticket.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Ticket price" }),
    (0, mongoose_1.Prop)({
        type: Number,
        required: true,
        min: 0,
    }),
    __metadata("design:type", Number)
], Ticket.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Total quantity of tickets" }),
    (0, mongoose_1.Prop)({
        type: Number,
        required: true,
        min: 0,
    }),
    __metadata("design:type", Number)
], Ticket.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Remaining quantity of tickets" }),
    (0, mongoose_1.Prop)({
        type: Number,
        required: true,
        min: 0,
        index: true,
    }),
    __metadata("design:type", Number)
], Ticket.prototype, "remainingQuantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: TicketType, description: "Type of ticket" }),
    (0, mongoose_1.Prop)({
        type: String,
        enum: TicketType,
        required: true,
        index: true,
    }),
    __metadata("design:type", String)
], Ticket.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Version number for optimistic locking" }),
    (0, mongoose_1.Prop)({
        type: Number,
        default: 0,
    }),
    __metadata("design:type", Number)
], Ticket.prototype, "version", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Additional ticket metadata" }),
    (0, mongoose_1.Prop)({
        type: mongoose_2.Schema.Types.Mixed,
        default: {},
    }),
    __metadata("design:type", Object)
], Ticket.prototype, "metadata", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: Boolean,
        default: true,
        index: true,
    }),
    __metadata("design:type", Boolean)
], Ticket.prototype, "isActive", void 0);
exports.Ticket = Ticket = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        collection: "tickets",
        toJSON: {
            virtuals: true,
            transform: (_, ret) => {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    })
], Ticket);
exports.TicketSchema = mongoose_1.SchemaFactory.createForClass(Ticket);
exports.TicketSchema.index({ eventId: 1, showingId: 1, status: 1 });
exports.TicketSchema.index({ eventId: 1, type: 1, status: 1 });
exports.TicketSchema.pre("save", function (next) {
    this.version = (this.version || 0) + 1;
    next();
});
//# sourceMappingURL=ticket.entity.js.map