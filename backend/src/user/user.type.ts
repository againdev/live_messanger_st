import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field({nullable: true})
  id?: number;

  @Field()
  fullname: string;

  @Field()
  email?: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field({ nullable: true })
  password?: string;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field()
  updatedAt?: Date;
}